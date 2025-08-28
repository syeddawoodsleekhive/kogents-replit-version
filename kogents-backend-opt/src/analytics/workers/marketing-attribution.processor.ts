import { Worker } from 'bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class MarketingAttributionProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    /**
     * Create the marketing attribution worker
     */
    createWorker() {
        const worker = new Worker(
            'analytics',
            async (job) => {
                this.logger.log(`Processing analytics job: ${job.name}`, 'MarketingAttributionProcessor');

                switch (job.name) {
                    case 'attribution_created':
                        await this.processAttributionCreated(job);
                        break;

                    case 'attribution_updated':
                        await this.processAttributionUpdated(job);
                        break;

                    case 'bulk_attributions_created':
                        await this.processBulkAttributionsCreated(job);
                        break;

                    case 'attribution_analytics':
                        await this.processAttributionAnalytics(job);
                        break;

                    case 'attribution_analytics_update':
                        await this.processAttributionAnalyticsUpdate(job);
                        break;

                    case 'conversion_tracked':
                        await this.processConversionTracked(job);
                        break;

                    case 'generate_conversion_analytics':
                        await this.processGenerateConversionAnalytics(job);
                        break;

                    default:
                        this.logger.warn(`Unknown analytics job: ${job.name}`, 'MarketingAttributionProcessor');
                        break;
                }

                this.logger.log(`Completed analytics job: ${job.name}`, 'MarketingAttributionProcessor');
            },
            {
                connection: this.redis,
            },
        );

        // Error handling
        worker.on('error', (error) => {
            this.logger.error('Marketing attribution worker error', undefined, 'MarketingAttributionProcessor', error);
        });

        worker.on('failed', (job, error) => {
            this.logger.error(`Marketing attribution worker job failed: ${job?.name}`, undefined, 'MarketingAttributionProcessor', error);
        });

        this.logger.log('Marketing attribution worker started successfully', 'MarketingAttributionProcessor');

        return worker;
    }

    /**
     * Process attribution creation job
     */
    private async processAttributionCreated(job: Job): Promise<void> {
        this.logger.log(`Processing attribution creation job: ${job.id}`, 'MarketingAttributionProcessor');

        try {
            const { attribution, timestamp } = job.data;

            // Write to database
            await this.prisma.marketingAttribution.create({
                data: {
                    id: attribution.id,
                    sessionToken: attribution.sessionToken,
                    utmSource: attribution.utmSource,
                    utmMedium: attribution.utmMedium,
                    utmCampaign: attribution.utmCampaign,
                    utmTerm: attribution.utmTerm,
                    utmContent: attribution.utmContent,
                    referrerUrl: attribution.referrerUrl,
                    landingPage: attribution.landingPage,
                    campaignId: attribution.campaignId,
                    adGroupId: attribution.adGroupId,
                    keyword: attribution.keyword,
                    gclid: attribution.gclid,
                    fbclid: attribution.fbclid,
                    conversionValue: attribution.conversionValue,
                    conversionCurrency: attribution.conversionCurrency,
                    createdAt: new Date(timestamp),
                    updatedAt: new Date(timestamp),
                },
            });

            this.logger.log(`Attribution created in database: ${attribution.id}`, 'MarketingAttributionProcessor');
        } catch (error) {
            this.logger.error(`Failed to process attribution creation: ${error.message}`, 'MarketingAttributionProcessor', error);
            throw error;
        }
    }

    /**
     * Process attribution update job
     */
    private async processAttributionUpdated(job: Job): Promise<void> {
        this.logger.log(`Processing attribution update job: ${job.id}`, 'MarketingAttributionProcessor');

        try {
            const { attributionId, updateData, timestamp } = job.data;

            // Update in database
            await this.prisma.marketingAttribution.update({
                where: { id: attributionId },
                data: {
                    conversionValue: updateData.conversionValue,
                    conversionCurrency: updateData.conversionCurrency,
                    updatedAt: new Date(timestamp),
                },
            });

            this.logger.log(`Attribution updated in database: ${attributionId}`, 'MarketingAttributionProcessor');
        } catch (error) {
            this.logger.error(`Failed to process attribution update: ${error.message}`, 'MarketingAttributionProcessor', error);
            throw error;
        }
    }

    /**
     * Process bulk attribution creation job
     */
    private async processBulkAttributionsCreated(job: Job): Promise<void> {
        this.logger.log(`Processing bulk attribution creation job: ${job.id}`, 'MarketingAttributionProcessor');

        try {
            const { attributions, timestamp } = job.data;

            // Bulk insert to database
            const data = attributions.map((attribution: any) => ({
                id: attribution.id,
                sessionToken: attribution.sessionToken,
                utmSource: attribution.utmSource,
                utmMedium: attribution.utmMedium,
                utmCampaign: attribution.utmCampaign,
                utmTerm: attribution.utmTerm,
                utmContent: attribution.utmContent,
                referrerUrl: attribution.referrerUrl,
                landingPage: attribution.landingPage,
                campaignId: attribution.campaignId,
                adGroupId: attribution.adGroupId,
                keyword: attribution.keyword,
                gclid: attribution.gclid,
                fbclid: attribution.fbclid,
                conversionValue: attribution.conversionValue,
                conversionCurrency: attribution.conversionCurrency,
                createdAt: new Date(timestamp),
                updatedAt: new Date(timestamp),
            }));

            await this.prisma.marketingAttribution.createMany({
                data,
                skipDuplicates: true,
            });

            this.logger.log(`Bulk attributions created in database: ${attributions.length}`, 'MarketingAttributionProcessor');
        } catch (error) {
            this.logger.error(`Failed to process bulk attribution creation: ${error.message}`, 'MarketingAttributionProcessor', error);
            throw error;
        }
    }

    /**
     * Process attribution analytics job
     */
    private async processAttributionAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing attribution analytics job: ${job.id}`, 'MarketingAttributionProcessor');

        try {
            const { attributionId, sessionToken, utmSource, utmCampaign, timestamp } = job.data;

            // Update analytics cache
            const analyticsKey = `analytics:attribution:${utmSource}:${utmCampaign}`;
            const existingAnalytics = await this.redis.get(analyticsKey);

            let analytics = existingAnalytics ? JSON.parse(existingAnalytics) : {
                totalAttributions: 0,
                totalValue: 0,
                averageValue: 0,
                topSources: [],
                topCampaigns: [],
            };

            // Update analytics data
            analytics.totalAttributions += 1;

            // Cache updated analytics
            await this.redis.setex(analyticsKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Attribution analytics updated: ${attributionId}`, 'MarketingAttributionProcessor');
        } catch (error) {
            this.logger.error(`Failed to process attribution analytics: ${error.message}`, 'MarketingAttributionProcessor', error);
            throw error;
        }
    }

    /**
     * Process attribution analytics update job
     */
    private async processAttributionAnalyticsUpdate(job: Job): Promise<void> {
        this.logger.log(`Processing attribution analytics update job: ${job.id}`, 'MarketingAttributionProcessor');

        try {
            const { attributionId, conversionValue, timestamp } = job.data;

            // Update conversion analytics cache
            const conversionKey = `analytics:conversion:${attributionId}`;
            const existingConversion = await this.redis.get(conversionKey);

            let conversionData = existingConversion ? JSON.parse(existingConversion) : {
                totalConversions: 0,
                totalValue: 0,
                averageValue: 0,
            };

            // Update conversion data
            conversionData.totalConversions += 1;
            conversionData.totalValue += conversionValue || 0;
            conversionData.averageValue = conversionData.totalValue / conversionData.totalConversions;

            // Cache updated conversion data
            await this.redis.setex(conversionKey, 7200, JSON.stringify(conversionData));

            this.logger.log(`Attribution conversion analytics updated: ${attributionId}`, 'MarketingAttributionProcessor');
        } catch (error) {
            this.logger.error(`Failed to process attribution analytics update: ${error.message}`, 'MarketingAttributionProcessor', error);
            throw error;
        }
    }

    /**
     * Process conversion tracking job
     */
    private async processConversionTracked(job: Job): Promise<void> {
        this.logger.log(`Processing conversion tracking job: ${job.id}`, 'MarketingAttributionProcessor');

        try {
            const { attributionId, conversionData, timestamp } = job.data;

            // Update conversion data in database
            await this.prisma.marketingAttribution.update({
                where: { id: attributionId },
                data: {
                    conversionValue: conversionData.value,
                    conversionCurrency: conversionData.currency || 'USD',
                    updatedAt: new Date(timestamp),
                },
            });

            // Update conversion cache
            const conversionKey = `analytics:conversion:${attributionId}`;
            await this.redis.setex(conversionKey, 7200, JSON.stringify(conversionData));

            this.logger.log(`Conversion tracked in database: ${attributionId}`, 'MarketingAttributionProcessor');
        } catch (error) {
            this.logger.error(`Failed to process conversion tracking: ${error.message}`, 'MarketingAttributionProcessor', error);
            throw error;
        }
    }

    /**
     * Process conversion analytics generation job
     */
    private async processGenerateConversionAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing conversion analytics generation job: ${job.id}`, 'MarketingAttributionProcessor');

        try {
            const { filters, cacheKey, timestamp } = job.data;

            // Build query based on filters
            const whereClause: any = {};

            if (filters.startDate) {
                whereClause.createdAt = {
                    gte: new Date(filters.startDate),
                };
            }

            if (filters.endDate) {
                whereClause.createdAt = {
                    ...whereClause.createdAt,
                    lte: new Date(filters.endDate),
                };
            }

            if (filters.utmSource) {
                whereClause.utmSource = filters.utmSource;
            }

            if (filters.utmCampaign) {
                whereClause.utmCampaign = filters.utmCampaign;
            }

            if (filters.utmMedium) {
                whereClause.utmMedium = filters.utmMedium;
            }

            // Get analytics data from database
            const [
                totalAttributions,
                totalConversions,
                totalValue,
                avgValue,
                topSources,
                topCampaigns,
            ] = await Promise.all([
                this.prisma.marketingAttribution.count({
                    where: whereClause,
                }),
                this.prisma.marketingAttribution.count({
                    where: {
                        ...whereClause,
                        conversionValue: { gt: 0 },
                    },
                }),
                this.prisma.marketingAttribution.aggregate({
                    where: whereClause,
                    _sum: { conversionValue: true },
                }),
                this.prisma.marketingAttribution.aggregate({
                    where: whereClause,
                    _avg: { conversionValue: true },
                }),
                this.prisma.marketingAttribution.groupBy({
                    by: ['utmSource'],
                    where: whereClause,
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 10,
                }),
                this.prisma.marketingAttribution.groupBy({
                    by: ['utmCampaign'],
                    where: whereClause,
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 10,
                }),
            ]);

            const analytics = {
                totalAttributions: totalAttributions || 0,
                totalConversions: totalConversions || 0,
                conversionRate: totalAttributions > 0 ? (totalConversions / totalAttributions) * 100 : 0,
                totalValue: totalValue._sum.conversionValue || 0,
                averageValue: avgValue._avg.conversionValue || 0,
                topSources,
                topCampaigns,
            };

            // Cache the analytics results
            await this.redis.setex(cacheKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Conversion analytics generated and cached: ${cacheKey}`, 'MarketingAttributionProcessor');
        } catch (error) {
            this.logger.error(`Failed to process conversion analytics generation: ${error.message}`, 'MarketingAttributionProcessor', error);
            throw error;
        }
    }
} 