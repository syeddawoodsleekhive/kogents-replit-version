import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeoIpService } from './geoip.service';
import { GeoIpController } from './geoip.controller';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { Reader } from '@maxmind/geoip2-node';

@Global()
@Module({
    imports: [ConfigModule],
    controllers: [GeoIpController],
    providers: [
        AppLoggerService,
        {
            provide: 'MAXMIND_COUNTRY_READER',
            useFactory: async (config: ConfigService, logger: AppLoggerService) => {
                const path = config.get<string>('maxmind.countryDbPath');
                if (!path) {
                    logger.warn('MAXMIND_COUNTRY_DB is not set; Country lookups disabled.', 'GeoIpModule');
                    return null;
                }
                try {
                    return await Reader.open(path);
                } catch (e) {
                    logger.warn(`Failed to open Country DB at ${path}: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpModule');
                    return null;
                }
            },
            inject: [ConfigService, AppLoggerService]
        },
        {
            provide: 'MAXMIND_CITY_READER',
            useFactory: async (config: ConfigService, logger: AppLoggerService) => {
                const path = config.get<string>('maxmind.cityDbPath');
                if (!path) {
                    logger.warn('MAXMIND_CITY_DB is not set; City lookups disabled.', 'GeoIpModule');
                    return null;
                }
                try {
                    return await Reader.open(path);
                } catch (e) {
                    logger.warn(`Failed to open City DB at ${path}: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpModule');
                    return null;
                }
            },
            inject: [ConfigService, AppLoggerService]
        },
        {
            provide: 'MAXMIND_ASN_READER',
            useFactory: async (config: ConfigService, logger: AppLoggerService) => {
                const path = config.get<string>('maxmind.asnDbPath');
                if (!path) {
                    logger.warn('MAXMIND_ASN_DB is not set; ASN lookups disabled.', 'GeoIpModule');
                    return null;
                }
                try {
                    return await Reader.open(path);
                } catch (e) {
                    logger.warn(`Failed to open ASN DB at ${path}: ${e instanceof Error ? e.message : String(e)}`, 'GeoIpModule');
                    return null;
                }
            },
            inject: [ConfigService, AppLoggerService]
        },
        GeoIpService
    ],
    exports: [GeoIpService]
})
export class GeoIpModule { }


