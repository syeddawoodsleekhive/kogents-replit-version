import { Worker } from 'bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class RegistrationSessionsProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    /**
     * Create the registration sessions worker
     */
    createWorker() {
        const worker = new Worker(
            'analytics',
            async (job) => {
                this.logger.log(`Processing analytics job: ${job.name}`, 'RegistrationSessionsProcessor');

                switch (job.name) {
                    case 'session_created':
                        await this.processSessionCreated(job);
                        break;

                    case 'session_updated':
                        await this.processSessionUpdated(job);
                        break;

                    case 'bulk_sessions_created':
                        await this.processBulkSessionsCreated(job);
                        break;

                    case 'session_analytics':
                        await this.processSessionAnalytics(job);
                        break;

                    case 'session_analytics_update':
                        await this.processSessionAnalyticsUpdate(job);
                        break;

                    case 'generate_session_analytics':
                        await this.processGenerateSessionAnalytics(job);
                        break;

                    default:
                        this.logger.warn(`Unknown analytics job: ${job.name}`, 'RegistrationSessionsProcessor');
                        break;
                }

                this.logger.log(`Completed analytics job: ${job.name}`, 'RegistrationSessionsProcessor');
            },
            {
                connection: this.redis,
            },
        );

        // Error handling
        worker.on('error', (error) => {
            this.logger.error('Registration sessions worker error', undefined, 'RegistrationSessionsProcessor', error);
        });

        worker.on('failed', (job, error) => {
            this.logger.error(`Registration sessions worker job failed: ${job?.name}`, undefined, 'RegistrationSessionsProcessor', error);
        });

        this.logger.log('Registration sessions worker started successfully', 'RegistrationSessionsProcessor');

        return worker;
    }

    /**
     * Process session creation job
     */
    private async processSessionCreated(job: Job): Promise<void> {
        this.logger.log(`Processing session creation job: ${job.id}`, 'RegistrationSessionsProcessor');

        try {
            const { session, timestamp } = job.data;

            // Write to database
            await this.prisma.registrationSession.create({
                data: {
                    sessionToken: session.sessionToken,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                    deviceFingerprint: session.deviceFingerprint,
                    country: session.country,
                    city: session.city,
                    timezone: session.timezone,
                    deviceType: session.deviceType,
                    browser: session.browser,
                    os: session.os,
                    screenResolution: session.screenResolution,
                    startedAt: session.startedAt ?? new Date(timestamp),
                    completedAt: session.completedAt ?? null,
                    abandonedAt: session.abandonedAt ?? null,
                    currentStep: session.currentStep ?? 'email',
                    totalSteps: session.totalSteps ?? 4,
                    completionPercentage: session.completionPercentage ?? 0,
                    pageLoadTime: session.pageLoadTime ?? null,
                    formInteractionTime: session.formInteractionTime ?? null,
                    totalSessionTime: session.totalSessionTime ?? null,
                    riskScore: session.riskScore ?? 0,
                    isVpn: session.isVpn ?? false,
                    isTor: session.isTor ?? false,
                    isProxy: session.isProxy ?? false,
                    registrationSuccessful: session.registrationSuccessful ?? false,
                    failureReason: session.failureReason ?? null,
                    createdAt: new Date(timestamp),
                    updatedAt: new Date(timestamp),
                },
            });

            this.logger.log(`Session created in database: ${session.sessionToken}`, 'RegistrationSessionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process session creation: ${error.message}`, 'RegistrationSessionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process session update job
     */
    private async processSessionUpdated(job: Job): Promise<void> {
        this.logger.log(`Processing session update job: ${job.id}`, 'RegistrationSessionsProcessor');

        try {
            const { sessionToken, updateData, timestamp } = job.data;

            // Update in database
            await this.prisma.registrationSession.update({
                where: { sessionToken },
                data: {
                    currentStep: updateData.currentStep,
                    completionPercentage: updateData.completionPercentage,
                    pageLoadTime: updateData.pageLoadTime,
                    formInteractionTime: updateData.formInteractionTime,
                    totalSessionTime: updateData.totalSessionTime,
                    riskScore: updateData.riskScore,
                    isVpn: updateData.isVpn,
                    isTor: updateData.isTor,
                    isProxy: updateData.isProxy,
                    registrationSuccessful: updateData.registrationSuccessful,
                    failureReason: updateData.failureReason,
                    completedAt: updateData.completedAt ? new Date(updateData.completedAt) : null,
                    abandonedAt: updateData.abandonedAt ? new Date(updateData.abandonedAt) : null,
                    updatedAt: new Date(timestamp),
                },
            });

            this.logger.log(`Session updated in database: ${sessionToken}`, 'RegistrationSessionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process session update: ${error.message}`, 'RegistrationSessionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process bulk session creation job
     */
    private async processBulkSessionsCreated(job: Job): Promise<void> {
        this.logger.log(`Processing bulk session creation job: ${job.id}`, 'RegistrationSessionsProcessor');

        try {
            const { sessions, timestamp } = job.data;

            // Bulk insert to database
            const data = sessions.map((session: any) => ({
                sessionToken: session.sessionToken,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                deviceFingerprint: session.deviceFingerprint,
                country: session.country,
                city: session.city,
                timezone: session.timezone,
                deviceType: session.deviceType,
                browser: session.browser,
                os: session.os,
                screenResolution: session.screenResolution,
                startedAt: session.startedAt ?? new Date(timestamp),
                completedAt: session.completedAt ?? null,
                abandonedAt: session.abandonedAt ?? null,
                currentStep: session.currentStep ?? 'email',
                totalSteps: session.totalSteps ?? 4,
                completionPercentage: session.completionPercentage ?? 0,
                pageLoadTime: session.pageLoadTime ?? null,
                formInteractionTime: session.formInteractionTime ?? null,
                totalSessionTime: session.totalSessionTime ?? null,
                riskScore: session.riskScore ?? 0,
                isVpn: session.isVpn ?? false,
                isTor: session.isTor ?? false,
                isProxy: session.isProxy ?? false,
                registrationSuccessful: session.registrationSuccessful ?? false,
                failureReason: session.failureReason ?? null,
                createdAt: new Date(timestamp),
                updatedAt: new Date(timestamp),
            }));

            await this.prisma.registrationSession.createMany({
                data,
                skipDuplicates: true,
            });

            this.logger.log(`Bulk sessions created in database: ${sessions.length}`, 'RegistrationSessionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process bulk session creation: ${error.message}`, 'RegistrationSessionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process session analytics job
     */
    private async processSessionAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing session analytics job: ${job.id}`, 'RegistrationSessionsProcessor');

        try {
            const { sessionToken, ipAddress, registrationSuccessful, timestamp } = job.data;

            // Update analytics cache
            const analyticsKey = `analytics:session:${ipAddress}`;
            const existingAnalytics = await this.redis.get(analyticsKey);

            let analytics = existingAnalytics ? JSON.parse(existingAnalytics) : {
                totalSessions: 0,
                successfulRegistrations: 0,
                conversionRate: 0,
                averageSessionDuration: 0,
                topCountries: [],
                topDevices: [],
            };

            // Update analytics data
            analytics.totalSessions += 1;
            if (registrationSuccessful) {
                analytics.successfulRegistrations += 1;
            }
            analytics.conversionRate = (analytics.successfulRegistrations / analytics.totalSessions) * 100;

            // Cache updated analytics
            await this.redis.setex(analyticsKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Session analytics updated: ${sessionToken}`, 'RegistrationSessionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process session analytics: ${error.message}`, 'RegistrationSessionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process session analytics update job
     */
    private async processSessionAnalyticsUpdate(job: Job): Promise<void> {
        this.logger.log(`Processing session analytics update job: ${job.id}`, 'RegistrationSessionsProcessor');

        try {
            const { sessionToken, currentStep, timestamp } = job.data;

            // Update step analytics cache
            const stepKey = `analytics:session_step:${currentStep}`;
            const existingStepData = await this.redis.get(stepKey);

            let stepData = existingStepData ? JSON.parse(existingStepData) : {
                totalSessions: 0,
                averageCompletionTime: 0,
                dropoffRate: 0,
            };

            // Update step data
            stepData.totalSessions += 1;

            // Cache updated step data
            await this.redis.setex(stepKey, 7200, JSON.stringify(stepData));

            this.logger.log(`Session step analytics updated: ${sessionToken}`, 'RegistrationSessionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process session analytics update: ${error.message}`, 'RegistrationSessionsProcessor', error);
            throw error;
        }
    }

    /**
     * Process session analytics generation job
     */
    private async processGenerateSessionAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing session analytics generation job: ${job.id}`, 'RegistrationSessionsProcessor');

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

            if (filters.country) {
                whereClause.country = filters.country;
            }

            if (filters.deviceType) {
                whereClause.deviceType = filters.deviceType;
            }

            // Note: UTM parameters are handled by MarketingAttribution model, not RegistrationSession
            // These filters should be applied to MarketingAttribution queries instead

            // Get analytics data from database
            const [
                totalSessions,
                successfulRegistrations,
                avgSessionDuration,
                topCountries,
                topDevices,
            ] = await Promise.all([
                this.prisma.registrationSession.count({
                    where: whereClause,
                }),
                this.prisma.registrationSession.count({
                    where: {
                        ...whereClause,
                        registrationSuccessful: true,
                    },
                }),
                this.prisma.registrationSession.aggregate({
                    where: whereClause,
                    _avg: { totalSessionTime: true },
                }),
                this.prisma.registrationSession.groupBy({
                    by: ['country'],
                    where: whereClause,
                    _count: { sessionToken: true },
                    orderBy: { _count: { sessionToken: 'desc' } },
                    take: 10,
                }),
                this.prisma.registrationSession.groupBy({
                    by: ['deviceType'],
                    where: whereClause,
                    _count: { sessionToken: true },
                    orderBy: { _count: { sessionToken: 'desc' } },
                    take: 5,
                }),
            ]);

            const analytics = {
                totalSessions: totalSessions || 0,
                successfulRegistrations: successfulRegistrations || 0,
                conversionRate: totalSessions > 0 ? (successfulRegistrations / totalSessions) * 100 : 0,
                averageSessionDuration: avgSessionDuration._avg.totalSessionTime || 0,
                topCountries,
                topDevices,
            };

            // Cache the analytics results
            await this.redis.setex(cacheKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Session analytics generated and cached: ${cacheKey}`, 'RegistrationSessionsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process session analytics generation: ${error.message}`, 'RegistrationSessionsProcessor', error);
            throw error;
        }
    }
} 