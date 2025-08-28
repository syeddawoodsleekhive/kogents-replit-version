import { Worker } from 'bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class UserInteractionsProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    /**
     * Create the user interactions worker
     */
    createWorker() {
        const worker = new Worker(
            'analytics',
            async (job) => {
                this.logger.log(`Processing analytics job: ${job.name}`, 'UserInteractionsProcessor');

                switch (job.name) {
                    case 'interaction_created':
                        await this.processInteractionCreated(job);
                        break;

                    case 'interaction_updated':
                        await this.processInteractionUpdated(job);
                        break;

                    case 'bulk_interactions_created':
                        await this.processBulkInteractionsCreated(job);
                        break;

                    case 'interaction_analytics':
                        await this.processInteractionAnalytics(job);
                        break;

                    case 'interaction_analytics_update':
                        await this.processInteractionAnalyticsUpdate(job);
                        break;

                    case 'generate_interaction_analytics':
                        await this.processGenerateInteractionAnalytics(job);
                        break;

                    default:
                        this.logger.warn(`Unknown analytics job: ${job.name}`, 'UserInteractionsProcessor');
                        break;
                }

                this.logger.log(`Completed analytics job: ${job.name}`, 'UserInteractionsProcessor');
            },
            {
                connection: this.redis,
            },
        );

        // Error handling
        worker.on('error', (error) => {
            this.logger.error('User interactions worker error', undefined, 'UserInteractionsProcessor', error);
        });

        worker.on('failed', (job, error) => {
            this.logger.error(`User interactions worker job failed: ${job?.name}`, undefined, 'UserInteractionsProcessor', error);
        });

        this.logger.log('User interactions worker started successfully', 'UserInteractionsProcessor');

        return worker;
    }

    /**
     * Process interaction creation job
     */
    private async processInteractionCreated(job: Job): Promise<void> {
        this.logger.log(`Processing interaction creation job: ${job.id}`, 'UserInteractionsProcessor');

        try {
            const { interaction, timestamp } = job.data;

            // Determine if it's a form interaction or user behavior
            if (interaction.interactionType === 'form_field' && interaction.fieldName) {
                // Write form interaction to database
                await this.prisma.formInteraction.create({
                    data: {
                        id: interaction.id,
                        sessionToken: interaction.sessionToken,
                        fieldName: interaction.fieldName,
                        interactionType: interaction.interactionType,
                        timestampMs: BigInt(interaction.timestampMs || Date.now()),
                        fieldFocusTime: interaction.fieldFocusTime,
                        typingSpeed: interaction.typingSpeed,
                        fieldCompleted: interaction.fieldCompleted || false,
                        validationPassed: interaction.validationPassed,
                        errorMessage: interaction.errorMessage,
                        attemptsCount: interaction.attemptsCount || 1,
                        inputLength: interaction.inputLength,
                        backspaceCount: interaction.backspaceCount || 0,
                        pasteDetected: interaction.pasteDetected || false,
                        autocompleteUsed: interaction.autocompleteUsed || false,
                        createdAt: new Date(timestamp),
                    },
                });
            } else {
                // Write user behavior to database
                await this.prisma.userBehavior.create({
                    data: {
                        id: interaction.id,
                        sessionToken: interaction.sessionToken,
                        behaviorType: interaction.behaviorType || interaction.interactionType,
                        elementId: interaction.elementId,
                        elementClass: interaction.elementClass,
                        elementText: interaction.elementText,
                        coordinates: interaction.coordinates,
                        scrollPosition: interaction.scrollPosition,
                        viewportSize: interaction.viewportSize,
                        timestampMs: BigInt(interaction.timestampMs || Date.now()),
                        duration: interaction.duration,
                        pageUrl: interaction.pageUrl,
                        referrerUrl: interaction.referrerUrl,
                        createdAt: new Date(timestamp),
                    },
                });
            }

            this.logger.log(`Interaction created in database: ${interaction.id}`, 'UserInteractionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process interaction creation: ${error.message}`, 'UserInteractionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process interaction update job
     */
    private async processInteractionUpdated(job: Job): Promise<void> {
        this.logger.log(`Processing interaction update job: ${job.id}`, 'UserInteractionsProcessor');

        try {
            const { interactionId, updateData, timestamp } = job.data;

            // Try to update in both tables (one will succeed)
            try {
                await this.prisma.formInteraction.update({
                    where: { id: interactionId },
                    data: {
                        fieldFocusTime: updateData.fieldFocusTime,
                        typingSpeed: updateData.typingSpeed,
                        fieldCompleted: updateData.fieldCompleted,
                        validationPassed: updateData.validationPassed,
                        errorMessage: updateData.errorMessage,
                        attemptsCount: updateData.attemptsCount,
                        inputLength: updateData.inputLength,
                        backspaceCount: updateData.backspaceCount,
                        pasteDetected: updateData.pasteDetected,
                        autocompleteUsed: updateData.autocompleteUsed,
                    },
                });
            } catch (error) {
                // If form interaction update fails, try user behavior
                await this.prisma.userBehavior.update({
                    where: { id: interactionId },
                    data: {
                        behaviorType: updateData.behaviorType,
                        elementId: updateData.elementId,
                        elementClass: updateData.elementClass,
                        elementText: updateData.elementText,
                        coordinates: updateData.coordinates,
                        scrollPosition: updateData.scrollPosition,
                        viewportSize: updateData.viewportSize,
                        duration: updateData.duration,
                        pageUrl: updateData.pageUrl,
                        referrerUrl: updateData.referrerUrl,
                    },
                });
            }

            this.logger.log(`Interaction updated in database: ${interactionId}`, 'UserInteractionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process interaction update: ${error.message}`, 'UserInteractionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process bulk interaction creation job
     */
    private async processBulkInteractionsCreated(job: Job): Promise<void> {
        this.logger.log(`Processing bulk interaction creation job: ${job.id}`, 'UserInteractionsProcessor');

        try {
            const { interactions, timestamp } = job.data;

            // Separate form interactions and user behaviors
            const formInteractions = interactions.filter((interaction: any) =>
                interaction.interactionType === 'form_field' && interaction.fieldName
            );
            const userBehaviors = interactions.filter((interaction: any) =>
                interaction.interactionType !== 'form_field'
            );

            // Bulk insert form interactions
            if (formInteractions.length > 0) {
                const formData = formInteractions.map((interaction: any) => ({
                    id: interaction.id,
                    sessionToken: interaction.sessionToken,
                    fieldName: interaction.fieldName,
                    interactionType: interaction.interactionType,
                    timestampMs: BigInt(interaction.timestampMs || Date.now()),
                    fieldFocusTime: interaction.fieldFocusTime,
                    typingSpeed: interaction.typingSpeed,
                    fieldCompleted: interaction.fieldCompleted || false,
                    validationPassed: interaction.validationPassed,
                    errorMessage: interaction.errorMessage,
                    attemptsCount: interaction.attemptsCount || 1,
                    inputLength: interaction.inputLength,
                    backspaceCount: interaction.backspaceCount || 0,
                    pasteDetected: interaction.pasteDetected || false,
                    autocompleteUsed: interaction.autocompleteUsed || false,
                    createdAt: new Date(timestamp),
                }));

                await this.prisma.formInteraction.createMany({
                    data: formData,
                    skipDuplicates: true,
                });
            }

            // Bulk insert user behaviors
            if (userBehaviors.length > 0) {
                const behaviorData = userBehaviors.map((interaction: any) => ({
                    id: interaction.id,
                    sessionToken: interaction.sessionToken,
                    behaviorType: interaction.behaviorType || interaction.interactionType,
                    elementId: interaction.elementId,
                    elementClass: interaction.elementClass,
                    elementText: interaction.elementText,
                    coordinates: interaction.coordinates,
                    scrollPosition: interaction.scrollPosition,
                    viewportSize: interaction.viewportSize,
                    timestampMs: BigInt(interaction.timestampMs || Date.now()),
                    duration: interaction.duration,
                    pageUrl: interaction.pageUrl,
                    referrerUrl: interaction.referrerUrl,
                    createdAt: new Date(timestamp),
                }));

                await this.prisma.userBehavior.createMany({
                    data: behaviorData,
                    skipDuplicates: true,
                });
            }

            this.logger.log(`Bulk interactions created in database: ${interactions.length}`, 'UserInteractionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process bulk interaction creation: ${error.message}`, 'UserInteractionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process interaction analytics job
     */
    private async processInteractionAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing interaction analytics job: ${job.id}`, 'UserInteractionsProcessor');

        try {
            const { interactionId, sessionToken, interactionType, timestamp } = job.data;

            // Update analytics cache
            const analyticsKey = `analytics:interaction:${interactionType}`;
            const existingAnalytics = await this.redis.get(analyticsKey);

            let analytics = existingAnalytics ? JSON.parse(existingAnalytics) : {
                totalInteractions: 0,
                totalValue: 0,
                averageValue: 0,
                topTypes: [],
            };

            // Update analytics data
            analytics.totalInteractions += 1;

            // Cache updated analytics
            await this.redis.setex(analyticsKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Interaction analytics updated: ${interactionId}`, 'UserInteractionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process interaction analytics: ${error.message}`, 'UserInteractionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process interaction analytics update job
     */
    private async processInteractionAnalyticsUpdate(job: Job): Promise<void> {
        this.logger.log(`Processing interaction analytics update job: ${job.id}`, 'UserInteractionsProcessor');

        try {
            const { interactionId, timestamp } = job.data;

            // Update interaction analytics cache
            const analyticsKey = `analytics:interaction_update:${interactionId}`;
            const existingAnalytics = await this.redis.get(analyticsKey);

            let analytics = existingAnalytics ? JSON.parse(existingAnalytics) : {
                totalUpdates: 0,
                lastUpdated: null,
            };

            // Update analytics data
            analytics.totalUpdates += 1;
            analytics.lastUpdated = timestamp;

            // Cache updated analytics
            await this.redis.setex(analyticsKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Interaction analytics update processed: ${interactionId}`, 'UserInteractionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process interaction analytics update: ${error.message}`, 'UserInteractionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process interaction analytics generation job
     */
    private async processGenerateInteractionAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing interaction analytics generation job: ${job.id}`, 'UserInteractionsProcessor');

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

            if (filters.sessionToken) {
                whereClause.sessionToken = filters.sessionToken;
            }

            if (filters.interactionType) {
                whereClause.interactionType = filters.interactionType;
            }

            // Get analytics data from database for both models
            const [
                totalFormInteractions,
                totalUserBehaviors,
                avgFormFocusTime,
                avgBehaviorDuration,
                topFormFields,
                topBehaviorTypes,
                topPages,
                formCompletionRate,
                errorRate,
            ] = await Promise.all([
                this.prisma.formInteraction.count({
                    where: whereClause,
                }),
                this.prisma.userBehavior.count({
                    where: whereClause,
                }),
                this.prisma.formInteraction.aggregate({
                    where: whereClause,
                    _avg: { fieldFocusTime: true },
                }),
                this.prisma.userBehavior.aggregate({
                    where: whereClause,
                    _avg: { duration: true },
                }),
                this.prisma.formInteraction.groupBy({
                    by: ['fieldName'],
                    where: whereClause,
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 10,
                }),
                this.prisma.userBehavior.groupBy({
                    by: ['behaviorType'],
                    where: whereClause,
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 10,
                }),
                this.prisma.userBehavior.groupBy({
                    by: ['pageUrl'],
                    where: whereClause,
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 10,
                }),
                this.calculateFormCompletionRate(whereClause),
                this.calculateErrorRate(whereClause),
            ]);

            const analytics = {
                totalInteractions: totalFormInteractions + totalUserBehaviors,
                totalFormInteractions: totalFormInteractions || 0,
                totalUserBehaviors: totalUserBehaviors || 0,
                averageFormFocusTime: avgFormFocusTime._avg?.fieldFocusTime || 0,
                averageBehaviorDuration: avgBehaviorDuration._avg?.duration || 0,
                topFormFields,
                topBehaviorTypes,
                topPages,
                formCompletionRate,
                errorRate,
            };

            // Cache the analytics results
            await this.redis.setex(cacheKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Interaction analytics generated and cached: ${cacheKey}`, 'UserInteractionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process interaction analytics generation: ${error.message}`, 'UserInteractionsProcessor', error);
            throw error;
        }
    }

    /**
     * Calculate form completion rate
     */
    private async calculateFormCompletionRate(whereClause: any): Promise<number> {
        const totalFields = await this.prisma.formInteraction.count({
            where: whereClause,
        });

        if (totalFields === 0) return 0;

        const completedFields = await this.prisma.formInteraction.count({
            where: {
                ...whereClause,
                fieldCompleted: true,
            },
        });

        return (completedFields / totalFields) * 100;
    }

    /**
     * Calculate error rate
     */
    private async calculateErrorRate(whereClause: any): Promise<number> {
        const totalFields = await this.prisma.formInteraction.count({
            where: whereClause,
        });

        if (totalFields === 0) return 0;

        const errorFields = await this.prisma.formInteraction.count({
            where: {
                ...whereClause,
                validationPassed: false,
            },
        });

        return (errorFields / totalFields) * 100;
    }
} 