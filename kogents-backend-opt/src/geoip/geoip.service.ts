import { Inject, Injectable } from '@nestjs/common';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { ReaderModel } from '@maxmind/geoip2-node';
import { Redis } from 'ioredis';

export interface GeoIpLookupOptions {
    locales?: string[];
}

@Injectable()
export class GeoIpService {
    constructor(
        private readonly logger: AppLoggerService,
        @Inject('MAXMIND_COUNTRY_READER') private readonly countryReader: ReaderModel | null,
        @Inject('MAXMIND_CITY_READER') private readonly cityReader: ReaderModel | null,
        @Inject('MAXMIND_ASN_READER') private readonly asnReader: ReaderModel | null,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    async getIpIntelligence(ip: string, options?: GeoIpLookupOptions) {
        const locales = options?.locales && options.locales.length ? options.locales : ['en'];
        const response: any = { ip: { ip } };

        // Redis caching constants
        const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
        const cacheKey = this.getCacheKey(ip, locales);

        // Warn if any reader is not initialized
        if (!this.asnReader) {
            this.logger.warn('MaxMind ASN reader is not initialized. Check MAXMIND_ASN_DB.', 'GeoIpService');
        }
        if (!this.countryReader) {
            this.logger.warn('MaxMind Country reader is not initialized. Check MAXMIND_COUNTRY_DB.', 'GeoIpService');
        }
        if (!this.cityReader) {
            this.logger.warn('MaxMind City reader is not initialized. Check MAXMIND_CITY_DB.', 'GeoIpService');
        }

        // Try cache first
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            this.logger.warn(`GeoIP cache read failed: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpService');
        }

        try {
            if (this.asnReader) {
                try {
                    const asn = this.asnReader.asn(ip);
                    response.asn = {
                        number: asn.autonomousSystemNumber,
                        organization: asn.autonomousSystemOrganization,
                        network: asn.network || undefined
                    };
                    if (!response.ip.network && asn.network) {
                        response.ip.network = asn.network;
                    }
                } catch (e) {
                    this.logger.warn(`ASN lookup failed for ${ip}: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpService');
                }
            }

            if (this.countryReader) {
                try {
                    const country = this.countryReader.country(ip);
                    response.continent = country.continent && {
                        code: country.continent.code,
                        geoname_id: country.continent.geonameId,
                        names: country.continent.names
                    };
                    response.country = country.country && {
                        iso_code: country.country.isoCode,
                        geoname_id: country.country.geonameId,
                        names: country.country.names,
                        is_in_european_union: country.country.isInEuropeanUnion
                    };
                    response.registered_country = country.registeredCountry && {
                        iso_code: country.registeredCountry.isoCode,
                        geoname_id: country.registeredCountry.geonameId,
                        names: country.registeredCountry.names,
                        is_in_european_union: country.registeredCountry.isInEuropeanUnion
                    };
                    response.represented_country = country.representedCountry && {
                        type: country.representedCountry.type,
                        iso_code: country.representedCountry.isoCode,
                        geoname_id: country.representedCountry.geonameId,
                        names: country.representedCountry.names,
                        is_in_european_union: country.representedCountry.isInEuropeanUnion
                    };
                    if (!response.ip.network && country.traits?.network) {
                        response.ip.network = country.traits.network;
                    }
                } catch (e) {
                    this.logger.warn(`Country lookup failed for ${ip}: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpService');
                }
            }

            if (this.cityReader) {
                try {
                    const city = this.cityReader.city(ip);
                    if (!response.continent && city.continent) {
                        response.continent = {
                            code: city.continent.code,
                            geoname_id: city.continent.geonameId,
                            names: city.continent.names
                        };
                    }
                    if (!response.country && city.country) {
                        response.country = {
                            iso_code: city.country.isoCode,
                            geoname_id: city.country.geonameId,
                            names: city.country.names,
                            is_in_european_union: city.country.isInEuropeanUnion
                        };
                    }
                    if (!response.registered_country && city.registeredCountry) {
                        response.registered_country = {
                            iso_code: city.registeredCountry.isoCode,
                            geoname_id: city.registeredCountry.geonameId,
                            names: city.registeredCountry.names,
                            is_in_european_union: city.registeredCountry.isInEuropeanUnion
                        };
                    }
                    if (!response.represented_country && city.representedCountry) {
                        response.represented_country = {
                            type: city.representedCountry.type,
                            iso_code: city.representedCountry.isoCode,
                            geoname_id: city.representedCountry.geonameId,
                            names: city.representedCountry.names,
                            is_in_european_union: city.representedCountry.isInEuropeanUnion
                        };
                    }
                    response.subdivisions = (city.subdivisions || []).map(s => ({
                        iso_code: s.isoCode,
                        geoname_id: s.geonameId,
                        names: s.names
                    }));
                    response.city = city.city && {
                        geoname_id: city.city.geonameId,
                        names: city.city.names
                    };
                    response.postal = city.postal && {
                        code: city.postal.code
                    };
                    response.location = city.location && {
                        latitude: city.location.latitude,
                        longitude: city.location.longitude,
                        accuracy_radius_km: city.location.accuracyRadius,
                        time_zone: city.location.timeZone,
                        metro_code: city.location.metroCode
                    };
                    if (!response.ip.network && city.traits?.network) {
                        response.ip.network = city.traits.network;
                    }
                } catch (e) {
                    this.logger.warn(`City lookup failed for ${ip}: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpService');
                }
            }

        } catch (error) {
            this.logger.error('GeoIP lookup unexpected error', undefined, 'GeoIpService', error as Error);
        }

        // Warn if no enrichment found
        if (!response.asn && !response.country && !response.registered_country && !response.city && !response.location) {
            this.logger.warn(`No GeoIP data found for ${ip}. Ensure databases contain this network.`, 'GeoIpService');
        }

        // Write to cache (best-effort)
        try {
            await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
        } catch (e) {
            this.logger.warn(`GeoIP cache write failed: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpService');
        }

        return response;
    }

    private getCacheKey(ip: string, locales: string[]): string {
        const localeKey = locales.join(',');
        return `geoip:ip:${ip}:loc:${localeKey}`;
    }
}


