import { Worker } from 'bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class SecurityEventsProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    /**
     * Create the security events worker
     */
    createWorker() {
        const worker = new Worker(
            'analytics',
            async (job) => {
                this.logger.log(`Processing analytics job: ${job.name}`, 'SecurityEventsProcessor');

                switch (job.name) {
                    case 'security_event_created':
                        await this.processSecurityEventCreated(job);
                        break;

                    case 'security_event_updated':
                        await this.processSecurityEventUpdated(job);
                        break;

                    case 'bulk_security_events_created':
                        await this.processBulkSecurityEventsCreated(job);
                        break;

                    case 'security_analytics':
                        await this.processSecurityAnalytics(job);
                        break;

                    case 'security_analytics_update':
                        await this.processSecurityAnalyticsUpdate(job);
                        break;

                    case 'generate_security_analytics':
                        await this.processGenerateSecurityAnalytics(job);
                        break;

                    default:
                        this.logger.warn(`Unknown analytics job: ${job.name}`, 'SecurityEventsProcessor');
                        break;
                }

                this.logger.log(`Completed analytics job: ${job.name}`, 'SecurityEventsProcessor');
            },
            {
                connection: this.redis,
            },
        );

        // Error handling
        worker.on('error', (error) => {
            this.logger.error('Security events worker error', undefined, 'SecurityEventsProcessor', error);
        });

        worker.on('failed', (job, error) => {
            this.logger.error(`Security events worker job failed: ${job?.name}`, undefined, 'SecurityEventsProcessor', error);
        });

        this.logger.log('Security events worker started successfully', 'SecurityEventsProcessor');

        return worker;
    }

    /**
     * Process security event creation job
     */
    private async processSecurityEventCreated(job: Job): Promise<void> {
        this.logger.log(`Processing security event creation job: ${job.id}`, 'SecurityEventsProcessor');

        try {
            const { event, timestamp } = job.data;

            // Prepare location data
            const location = {
                country: event.country,
                city: event.city,
                timezone: event.timezone,
                deviceType: event.deviceType,
                browser: event.browser,
                os: event.os,
                screenResolution: event.screenResolution,
            };

            // Prepare threat indicators
            const threatIndicators = {
                isVpn: event.isVpn,
                isTor: event.isTor,
                isProxy: event.isProxy,
            };

            // Prepare mitigation actions
            const mitigationActions = {
                blocked: event.blocked,
                reason: event.reason,
            };

            // Write to database
            await this.prisma.securityEvent.create({
                data: {
                    id: event.id,
                    sessionToken: event.sessionToken,
                    eventType: event.eventType,
                    severity: event.severity,
                    description: event.description || `${event.eventType} event`,
                    ipAddress: event.ipAddress,
                    userAgent: event.userAgent,
                    deviceFingerprint: event.deviceFingerprint,
                    location: location,
                    riskScore: event.riskScore,
                    threatIndicators: threatIndicators,
                    mitigationActions: mitigationActions,
                    metadata: event.metadata,
                    createdAt: new Date(timestamp),
                },
            });

            this.logger.log(`Security event created in database: ${event.id}`, 'SecurityEventsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process security event creation: ${error.message}`, 'SecurityEventsProcessor', error);
            throw error;
        }
    }

    /**
     * Process security event update job
     */
    private async processSecurityEventUpdated(job: Job): Promise<void> {
        this.logger.log(`Processing security event update job: ${job.id}`, 'SecurityEventsProcessor');

        try {
            const { eventId, updateData, timestamp } = job.data;

            // Prepare mitigation actions
            const mitigationActions = {
                blocked: updateData.blocked,
                reason: updateData.reason,
            };

            // Update in database
            await this.prisma.securityEvent.update({
                where: { id: eventId },
                data: {
                    severity: updateData.severity,
                    riskScore: updateData.riskScore,
                    threatIndicators: updateData.threatIndicators,
                    mitigationActions: mitigationActions,
                    metadata: updateData.metadata,
                },
            });

            this.logger.log(`Security event updated in database: ${eventId}`, 'SecurityEventsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process security event update: ${error.message}`, 'SecurityEventsProcessor', error);
            throw error;
        }
    }

    /**
     * Process bulk security events creation job
     */
    private async processBulkSecurityEventsCreated(job: Job): Promise<void> {
        this.logger.log(`Processing bulk security events creation job: ${job.id}`, 'SecurityEventsProcessor');

        try {
            const { events, timestamp } = job.data;

            // Bulk insert to database
            const data = events.map((event: any) => {
                // Prepare location data
                const location = {
                    country: event.country,
                    city: event.city,
                    timezone: event.timezone,
                    deviceType: event.deviceType,
                    browser: event.browser,
                    os: event.os,
                    screenResolution: event.screenResolution,
                };

                // Prepare threat indicators
                const threatIndicators = {
                    isVpn: event.isVpn,
                    isTor: event.isTor,
                    isProxy: event.isProxy,
                };

                // Prepare mitigation actions
                const mitigationActions = {
                    blocked: event.blocked,
                    reason: event.reason,
                };

                return {
                    id: event.id,
                    sessionToken: event.sessionToken,
                    eventType: event.eventType,
                    severity: event.severity,
                    description: event.description || `${event.eventType} event`,
                    ipAddress: event.ipAddress,
                    userAgent: event.userAgent,
                    deviceFingerprint: event.deviceFingerprint,
                    location: location,
                    riskScore: event.riskScore,
                    threatIndicators: threatIndicators,
                    mitigationActions: mitigationActions,
                    metadata: event.metadata,
                    createdAt: new Date(timestamp),
                };
            });

            await this.prisma.securityEvent.createMany({
                data,
                skipDuplicates: true,
            });

            this.logger.log(`Bulk security events created in database: ${events.length}`, 'SecurityEventsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process bulk security events creation: ${error.message}`, 'SecurityEventsProcessor', error);
            throw error;
        }
    }

    /**
     * Process security analytics job
     */
    private async processSecurityAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing security analytics job: ${job.id}`, 'SecurityEventsProcessor');

        try {
            const { eventId, ipAddress, eventType, severity, timestamp } = job.data;

            // Update analytics cache
            const analyticsKey = `analytics:security:${ipAddress}`;
            const existingAnalytics = await this.redis.get(analyticsKey);

            let analytics = existingAnalytics ? JSON.parse(existingAnalytics) : {
                totalEvents: 0,
                highSeverityEvents: 0,
                blockedEvents: 0,
                topEventTypes: [],
                topThreats: [],
            };

            // Update analytics data
            analytics.totalEvents += 1;
            if (severity === 'HIGH') {
                analytics.highSeverityEvents += 1;
            }

            // Cache updated analytics
            await this.redis.setex(analyticsKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Security analytics updated: ${eventId}`, 'SecurityEventsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process security analytics: ${error.message}`, 'SecurityEventsProcessor', error);
            throw error;
        }
    }

    /**
     * Process security analytics update job
     */
    private async processSecurityAnalyticsUpdate(job: Job): Promise<void> {
        this.logger.log(`Processing security analytics update job: ${job.id}`, 'SecurityEventsProcessor');

        try {
            const { eventId, blocked, severity, timestamp } = job.data;

            // Update threat analytics cache
            const threatKey = `analytics:threat:${severity}`;
            const existingThreatData = await this.redis.get(threatKey);

            let threatData = existingThreatData ? JSON.parse(existingThreatData) : {
                totalEvents: 0,
                blockedEvents: 0,
                averageRiskScore: 0,
            };

            // Update threat data
            threatData.totalEvents += 1;
            if (blocked) {
                threatData.blockedEvents += 1;
            }

            // Cache updated threat data
            await this.redis.setex(threatKey, 7200, JSON.stringify(threatData));

            this.logger.log(`Security threat analytics updated: ${eventId}`, 'SecurityEventsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process security analytics update: ${error.message}`, 'SecurityEventsProcessor', error);
            throw error;
        }
    }

    /**
     * Process security analytics generation job
     */
    private async processGenerateSecurityAnalytics(job: Job): Promise<void> {
        this.logger.log(`Processing security analytics generation job: ${job.id}`, 'SecurityEventsProcessor');

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

            if (filters.eventType) {
                whereClause.eventType = filters.eventType;
            }

            if (filters.severity) {
                whereClause.severity = filters.severity;
            }

            // Get analytics data from database
            const [
                totalEvents,
                highSeverityEvents,
                avgRiskScore,
                topEventTypes,
                topSeverities,
            ] = await Promise.all([
                this.prisma.securityEvent.count({
                    where: whereClause,
                }),
                this.prisma.securityEvent.count({
                    where: {
                        ...whereClause,
                        severity: 'HIGH',
                    },
                }),
                this.prisma.securityEvent.aggregate({
                    where: whereClause,
                    _avg: { riskScore: true },
                }),
                this.prisma.securityEvent.groupBy({
                    by: ['eventType'],
                    where: whereClause,
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 10,
                }),
                this.prisma.securityEvent.groupBy({
                    by: ['severity'],
                    where: whereClause,
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 5,
                }),
            ]);

            const analytics = {
                totalEvents: totalEvents || 0,
                highSeverityEvents: highSeverityEvents || 0,
                highSeverityRate: totalEvents > 0 ? (highSeverityEvents / totalEvents) * 100 : 0,
                averageRiskScore: avgRiskScore._avg.riskScore || 0,
                topEventTypes,
                topSeverities,
            };

            // Cache the analytics results
            await this.redis.setex(cacheKey, 7200, JSON.stringify(analytics));

            this.logger.log(`Security analytics generated and cached: ${cacheKey}`, 'SecurityEventsProcessor');
        } catch (error) {
            this.logger.error(`Failed to process security analytics generation: ${error.message}`, 'SecurityEventsProcessor', error);
            throw error;
        }
    }
} 