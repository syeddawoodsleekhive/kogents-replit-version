import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import {
    CreateAttributionDto,
    UpdateAttributionDto,
    AttributionResponseDto,
    ConversionAnalyticsDto
} from '../dtos/marketing-attributions';

@Injectable()
export class MarketingAttributionService {
    private readonly CACHE_TTL = 7200; // 2 hours
    private readonly ATTRIBUTION_CACHE_PREFIX = 'analytics:attribution:';
    private readonly CONVERSION_CACHE_PREFIX = 'analytics:conversion:';
    private readonly UTM_CACHE_PREFIX = 'analytics:utm:';
    private readonly SESSION_CACHE_PREFIX = 'analytics:session:';

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
    ) { }

    /**
     * Create marketing attribution record - Cache-first, queue-driven
     */
    async createAttribution(dto: CreateAttributionDto): Promise<AttributionResponseDto> {
        this.logger.log(`Creating marketing attribution for session: ${dto.sessionToken}`, 'MarketingAttributionService');

        try {
            // Generate ID for cache storage
            const attributionId = this.generateSecureId();
            const timestamp = new Date().toISOString();

            // Create attribution object for cache
            const attribution = {
                id: attributionId,
                sessionToken: dto.sessionToken,
                utmSource: dto.utmSource,
                utmMedium: dto.utmMedium,
                utmCampaign: dto.utmCampaign,
                utmTerm: dto.utmTerm,
                utmContent: dto.utmContent,
                referrerUrl: dto.referrerUrl,
                landingPage: dto.landingPage,
                campaignId: dto.campaignId,
                adGroupId: dto.adGroupId,
                keyword: dto.keyword,
                gclid: dto.gclid,
                fbclid: dto.fbclid,
                conversionValue: dto.conversionValue,
                conversionCurrency: dto.conversionCurrency,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            // Write to cache immediately
            await this.cacheAttribution(attribution);

            // Cache by session token for quick lookup
            await this.cacheSessionAttribution(dto.sessionToken, attributionId);

            // Cache UTM parameters for quick lookup
            await this.cacheUtmData(attribution);

            // Queue database write for background processing
            await this.analyticsQueue.add('attribution_created', {
                attribution,
                timestamp,
                priority: 'high',
            }, {
                delay: 1000, // 1 second delay for eventual consistency
            });

            // Queue analytics processing
            await this.analyticsQueue.add('attribution_analytics', {
                attributionId,
                sessionToken: dto.sessionToken,
                utmSource: dto.utmSource,
                utmCampaign: dto.utmCampaign,
                timestamp,
            }, {
                delay: 5000, // 5 second delay for analytics
            });

            this.logger.log(`Marketing attribution cached and queued: ${attributionId}`, 'MarketingAttributionService');

            return this.mapToResponseDto(attribution);
        } catch (error) {
            this.logger.error(`Failed to create marketing attribution: ${error.message}`, 'MarketingAttributionService', error);
            throw new BadRequestException('Failed to create marketing attribution');
        }
    }

    /**
     * Update marketing attribution - Cache-first, queue-driven
     */
    async updateAttribution(attributionId: string, dto: UpdateAttributionDto): Promise<AttributionResponseDto> {
        this.logger.log(`Updating marketing attribution: ${attributionId}`, 'MarketingAttributionService');

        // Get from cache first
        let attribution = await this.getAttributionFromCache(attributionId);

        if (!attribution) {
            // Fallback to database if not in cache
            attribution = await this.prisma.marketingAttribution.findUnique({
                where: { id: attributionId },
            });

            if (!attribution) {
                throw new NotFoundException('Marketing attribution not found');
            }

            // Cache the found attribution
            await this.cacheAttribution(attribution);
        }

        // Update attribution object
        const updatedAttribution = {
            ...attribution,
            conversionValue: dto.conversionValue,
            conversionCurrency: dto.conversionCurrency,
            updatedAt: new Date().toISOString(),
        };

        // Update cache immediately
        await this.cacheAttribution(updatedAttribution);

        // Queue database update for background processing
        await this.analyticsQueue.add('attribution_updated', {
            attributionId,
            updateData: {
                conversionValue: dto.conversionValue,
                conversionCurrency: dto.conversionCurrency,
            },
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000, // 1 second delay
        });

        // Queue analytics update
        await this.analyticsQueue.add('attribution_analytics_update', {
            attributionId,
            conversionValue: dto.conversionValue,
            timestamp: new Date().toISOString(),
        }, {
            delay: 5000, // 5 second delay
        });

        this.logger.log(`Marketing attribution updated in cache and queued: ${attributionId}`, 'MarketingAttributionService');

        return this.mapToResponseDto(updatedAttribution);
    }

    /**
     * Get marketing attribution by ID - Cache-first
     */
    async getAttribution(attributionId: string): Promise<AttributionResponseDto> {
        // Try cache first
        let attribution = await this.getAttributionFromCache(attributionId);

        if (!attribution) {
            // Fallback to database
            attribution = await this.prisma.marketingAttribution.findUnique({
                where: { id: attributionId },
            });

            if (!attribution) {
                throw new NotFoundException('Marketing attribution not found');
            }

            // Cache for future requests
            await this.cacheAttribution(attribution);
        }

        return this.mapToResponseDto(attribution);
    }

    /**
     * Get marketing attribution by session token - Cache-first
     */
    async getAttributionBySession(sessionToken: string): Promise<AttributionResponseDto[]> {
        // Try to get attribution IDs from session cache
        const cachedIds = await this.getSessionAttributionIds(sessionToken);

        if (cachedIds && cachedIds.length > 0) {
            // Get attributions from cache
            const attributions: any[] = [];
            for (const id of cachedIds) {
                const attribution = await this.getAttributionFromCache(id);
                if (attribution) {
                    attributions.push(attribution);
                }
            }

            if (attributions.length > 0) {
                return attributions.map(attribution => this.mapToResponseDto(attribution));
            }
        }

        // Fallback to database
        const attributions = await this.prisma.marketingAttribution.findMany({
            where: { sessionToken },
            orderBy: { createdAt: 'desc' },
        });

        // Cache all attributions and session mapping
        for (const attribution of attributions) {
            await this.cacheAttribution(attribution);
        }
        await this.cacheSessionAttributionIds(sessionToken, attributions.map(a => a.id));

        return attributions.map(attribution => this.mapToResponseDto(attribution));
    }

    /**
     * Get attribution by UTM parameters - Cache-first
     */
    async getAttributionByUtm(utmSource: string, utmMedium: string, utmCampaign: string): Promise<AttributionResponseDto[]> {
        // Try cache first
        const cacheKey = `${this.UTM_CACHE_PREFIX}${utmSource}:${utmMedium}:${utmCampaign}`;
        const cachedIds = await this.getUtmCache(cacheKey);

        if (cachedIds && cachedIds.length > 0) {
            const attributions: any[] = [];
            for (const id of cachedIds) {
                const attribution = await this.getAttributionFromCache(id);
                if (attribution) {
                    attributions.push(attribution);
                }
            }

            if (attributions.length > 0) {
                return attributions.map(attribution => this.mapToResponseDto(attribution));
            }
        }

        // Fallback to database
        const attributions = await this.prisma.marketingAttribution.findMany({
            where: {
                utmSource,
                utmMedium,
                utmCampaign,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Cache results
        for (const attribution of attributions) {
            await this.cacheAttribution(attribution);
        }
        await this.setUtmCache(cacheKey, attributions.map(a => a.id));

        return attributions.map(attribution => this.mapToResponseDto(attribution));
    }

    /**
     * Track conversion event - Cache-first, queue-driven
     */
    async trackConversion(attributionId: string, conversionData: any): Promise<void> {
        this.logger.log(`Tracking conversion for attribution: ${attributionId}`, 'MarketingAttributionService');

        // Cache conversion data immediately
        await this.cacheConversion(attributionId, conversionData);

        // Queue background processing
        await this.analyticsQueue.add('conversion_tracked', {
            attributionId,
            conversionData,
            timestamp: new Date().toISOString(),
        }, {
            delay: 2000, // 2 second delay
        });
    }

    /**
     * Get conversion analytics - Cache-first
     */
    async getConversionAnalytics(filters: ConversionAnalyticsDto): Promise<any> {
        this.logger.log('Getting conversion analytics', 'MarketingAttributionService');

        // Try cache first
        const cacheKey = `analytics:conversion_analytics:${JSON.stringify(filters)}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        // Queue analytics generation if not in cache
        await this.analyticsQueue.add('generate_conversion_analytics', {
            filters,
            cacheKey,
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000,
        });

        // Return cached result or empty result
        return cached ? JSON.parse(cached) : {
            totalConversions: 0,
            totalValue: 0,
            averageValue: 0,
            topCampaigns: [],
        };
    }

    /**
     * Bulk create attributions - Cache-first, queue-driven
     */
    async bulkCreateAttributions(attributions: CreateAttributionDto[]): Promise<number> {
        this.logger.log(`Bulk creating ${attributions.length} attributions`, 'MarketingAttributionService');

        try {
            const createdAttributions: any[] = [];
            const timestamp = new Date().toISOString();

            // Create all attributions in cache first
            for (const dto of attributions) {
                const attributionId = this.generateSecureId();
                const attribution: any = {
                    id: attributionId,
                    sessionToken: dto.sessionToken,
                    utmSource: dto.utmSource,
                    utmMedium: dto.utmMedium,
                    utmCampaign: dto.utmCampaign,
                    utmTerm: dto.utmTerm,
                    utmContent: dto.utmContent,
                    referrerUrl: dto.referrerUrl,
                    landingPage: dto.landingPage,
                    campaignId: dto.campaignId,
                    adGroupId: dto.adGroupId,
                    keyword: dto.keyword,
                    gclid: dto.gclid,
                    fbclid: dto.fbclid,
                    conversionValue: dto.conversionValue,
                    conversionCurrency: dto.conversionCurrency,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                };

                // Cache immediately
                await this.cacheAttribution(attribution);
                await this.cacheSessionAttribution(dto.sessionToken, attributionId);
                await this.cacheUtmData(attribution);

                createdAttributions.push(attribution);
            }

            // Queue bulk database write
            await this.analyticsQueue.add('bulk_attributions_created', {
                attributions: createdAttributions,
                timestamp,
            }, {
                delay: 2000, // 2 second delay
            });

            this.logger.log(`Bulk created ${createdAttributions.length} attributions in cache and queued`, 'MarketingAttributionService');

            return createdAttributions.length;
        } catch (error) {
            this.logger.error(`Failed to bulk create attributions: ${error.message}`, 'MarketingAttributionService', error);
            throw new BadRequestException('Failed to bulk create attributions');
        }
    }

    /**
     * Cache attribution data
     */
    private async cacheAttribution(attribution: any): Promise<void> {
        try {
            const cacheKey = `${this.ATTRIBUTION_CACHE_PREFIX}${attribution.id}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(attribution));
        } catch (error) {
            this.logger.warn(`Failed to cache attribution: ${error.message}`, 'MarketingAttributionService');
        }
    }

    /**
     * Get attribution from cache
     */
    private async getAttributionFromCache(attributionId: string): Promise<any | null> {
        try {
            const cacheKey = `${this.ATTRIBUTION_CACHE_PREFIX}${attributionId}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get attribution from cache: ${error.message}`, 'MarketingAttributionService');
            return null;
        }
    }

    /**
     * Cache session attribution mapping
     */
    private async cacheSessionAttribution(sessionToken: string, attributionId: string): Promise<void> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionToken}`;
            const existingIds = await this.getSessionAttributionIds(sessionToken);
            const updatedIds = existingIds ? [...existingIds, attributionId] : [attributionId];
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(updatedIds));
        } catch (error) {
            this.logger.warn(`Failed to cache session attribution: ${error.message}`, 'MarketingAttributionService');
        }
    }

    /**
     * Get session attribution IDs
     */
    private async getSessionAttributionIds(sessionToken: string): Promise<string[] | null> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionToken}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get session attribution IDs: ${error.message}`, 'MarketingAttributionService');
            return null;
        }
    }

    /**
     * Cache session attribution IDs
     */
    private async cacheSessionAttributionIds(sessionToken: string, attributionIds: string[]): Promise<void> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionToken}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(attributionIds));
        } catch (error) {
            this.logger.warn(`Failed to cache session attribution IDs: ${error.message}`, 'MarketingAttributionService');
        }
    }

    /**
     * Cache UTM data
     */
    private async cacheUtmData(attribution: any): Promise<void> {
        try {
            if (attribution.utmSource && attribution.utmMedium && attribution.utmCampaign) {
                const cacheKey = `${this.UTM_CACHE_PREFIX}${attribution.utmSource}:${attribution.utmMedium}:${attribution.utmCampaign}`;
                const existingIds = await this.getUtmCache(cacheKey);
                const updatedIds = existingIds ? [...existingIds, attribution.id] : [attribution.id];
                await this.setUtmCache(cacheKey, updatedIds);
            }
        } catch (error) {
            this.logger.warn(`Failed to cache UTM data: ${error.message}`, 'MarketingAttributionService');
        }
    }

    /**
     * Get UTM cache
     */
    private async getUtmCache(cacheKey: string): Promise<string[] | null> {
        try {
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get UTM cache: ${error.message}`, 'MarketingAttributionService');
            return null;
        }
    }

    /**
     * Set UTM cache
     */
    private async setUtmCache(cacheKey: string, ids: string[]): Promise<void> {
        try {
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(ids));
        } catch (error) {
            this.logger.warn(`Failed to set UTM cache: ${error.message}`, 'MarketingAttributionService');
        }
    }

    /**
     * Cache conversion data
     */
    private async cacheConversion(attributionId: string, conversionData: any): Promise<void> {
        try {
            const cacheKey = `${this.CONVERSION_CACHE_PREFIX}${attributionId}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(conversionData));
        } catch (error) {
            this.logger.warn(`Failed to cache conversion: ${error.message}`, 'MarketingAttributionService');
        }
    }

    /**
     * Generate secure ID for cache storage
     */
    private generateSecureId(): string {
        return `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Map to response DTO
     */
    private mapToResponseDto(attribution: any): AttributionResponseDto {
        return {
            id: attribution.id,
            sessionToken: attribution.sessionToken,
            referrerUrl: attribution.referrerUrl,
            utmSource: attribution.utmSource,
            utmMedium: attribution.utmMedium,
            utmCampaign: attribution.utmCampaign,
            utmTerm: attribution.utmTerm,
            utmContent: attribution.utmContent,
            landingPage: attribution.landingPage,
            campaignId: attribution.campaignId,
            adGroupId: attribution.adGroupId,
            keyword: attribution.keyword,
            gclid: attribution.gclid,
            fbclid: attribution.fbclid,
            conversionValue: attribution.conversionValue,
            conversionCurrency: attribution.conversionCurrency,
            createdAt: attribution.createdAt,
            updatedAt: attribution.updatedAt,
        };
    }
} 