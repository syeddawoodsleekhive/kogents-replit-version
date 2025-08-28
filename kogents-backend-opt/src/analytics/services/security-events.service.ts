import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import {
    CreateSecurityEventDto,
    UpdateSecurityEventDto,
    SecurityEventResponseDto,
    SecurityEventAnalyticsDto
} from '../dtos/security-events';

@Injectable()
export class SecurityEventsService {
    private readonly CACHE_TTL = 7200; // 2 hours
    private readonly EVENT_CACHE_PREFIX = 'analytics:security:';
    private readonly USER_CACHE_PREFIX = 'analytics:user_security:';
    private readonly TYPE_CACHE_PREFIX = 'analytics:security_type:';
    private readonly SEVERITY_CACHE_PREFIX = 'analytics:security_severity:';

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
    ) { }

    /**
     * Create security event - Cache-first, queue-driven
     */
    async createSecurityEvent(dto: CreateSecurityEventDto): Promise<SecurityEventResponseDto> {
        this.logger.log(`Creating security event for session: ${dto.sessionToken}`, 'SecurityEventsService');

        try {
            // Generate event ID for cache storage
            const eventId = this.generateSecureId();
            const timestamp = new Date().toISOString();

            // Create event object for cache
            const event = {
                id: eventId,
                sessionToken: dto.sessionToken,
                eventType: dto.eventType,
                severity: dto.severity || 'LOW',
                description: dto.description,
                ipAddress: dto.ipAddress,
                userAgent: dto.userAgent,
                deviceFingerprint: dto.deviceFingerprint,
                location: dto.location,
                riskScore: dto.riskScore,
                threatIndicators: dto.threatIndicators,
                mitigationActions: dto.mitigationActions,
                metadata: dto.metadata,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            // Write to cache immediately
            await this.cacheSecurityEvent(event);

            // Cache by session token for quick lookup
            await this.cacheUserSecurityEvent(dto.sessionToken, eventId);

            // Cache by event type for analytics
            await this.cacheTypeSecurityEvent(dto.eventType, eventId);

            // Cache by severity for analytics (ensure string)
            await this.cacheSeveritySecurityEvent(event.severity, eventId);

            // Queue database write for background processing
            await this.analyticsQueue.add('security_event_created', {
                event,
                timestamp,
                priority: 'high',
            }, {
                delay: 1000, // 1 second delay for eventual consistency
            });

            // Queue analytics processing
            await this.analyticsQueue.add('security_event_analytics', {
                eventId,
                sessionToken: dto.sessionToken,
                eventType: dto.eventType,
                severity: event.severity,
                timestamp,
            }, {
                delay: 5000, // 5 second delay for analytics
            });

            this.logger.log(`Security event cached and queued: ${eventId}`, 'SecurityEventsService');

            return this.mapToResponseDto(event);
        } catch (error) {
            this.logger.error(`Failed to create security event: ${error.message}`, 'SecurityEventsService', error);
            throw new BadRequestException('Failed to create security event');
        }
    }

    /**
     * Update security event - Cache-first, queue-driven
     */
    async updateSecurityEvent(eventId: string, dto: UpdateSecurityEventDto): Promise<SecurityEventResponseDto> {
        this.logger.log(`Updating security event: ${eventId}`, 'SecurityEventsService');

        // Get from cache first
        let event = await this.getSecurityEventFromCache(eventId);

        if (!event) {
            // Fallback to database if not in cache
            event = await this.prisma.securityEvent.findUnique({
                where: { id: eventId },
            });

            if (!event) {
                throw new NotFoundException('Security event not found');
            }

            // Cache the found event
            await this.cacheSecurityEvent(event);
        }

        // Update event object
        const updatedEvent = {
            ...event,
            severity: dto.severity ?? event.severity,
            riskScore: dto.riskScore ?? event.riskScore,
            threatIndicators: dto.threatIndicators ?? event.threatIndicators,
            mitigationActions: dto.mitigationActions ?? event.mitigationActions,
            metadata: dto.metadata ?? event.metadata,
            updatedAt: new Date().toISOString(),
        };

        // Update cache immediately
        await this.cacheSecurityEvent(updatedEvent);

        // Queue database update for background processing
        await this.analyticsQueue.add('security_event_updated', {
            eventId,
            updateData: {
                severity: dto.severity,
                riskScore: dto.riskScore,
                threatIndicators: dto.threatIndicators,
                mitigationActions: dto.mitigationActions,
                metadata: dto.metadata,
            },
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000, // 1 second delay
        });

        // Queue analytics update
        await this.analyticsQueue.add('security_event_analytics_update', {
            eventId,
            timestamp: new Date().toISOString(),
        }, {
            delay: 5000, // 5 second delay
        });

        this.logger.log(`Security event updated in cache and queued: ${eventId}`, 'SecurityEventsService');

        return this.mapToResponseDto(updatedEvent);
    }

    /**
     * Get security event by ID - Cache-first
     */
    async getSecurityEvent(eventId: string): Promise<SecurityEventResponseDto> {
        // Try cache first
        let event = await this.getSecurityEventFromCache(eventId);

        if (!event) {
            // Fallback to database
            event = await this.prisma.securityEvent.findUnique({
                where: { id: eventId },
            });

            if (!event) {
                throw new NotFoundException('Security event not found');
            }

            // Cache for future requests
            await this.cacheSecurityEvent(event);
        }

        return this.mapToResponseDto(event);
    }

    /**
     * Get security events by user/session token - Cache-first
     */
    async getSecurityEventsByUser(sessionToken: string): Promise<SecurityEventResponseDto[]> {
        // Try to get event IDs from user/session cache
        const cachedIds = await this.getUserSecurityEventIds(sessionToken);

        if (cachedIds && cachedIds.length > 0) {
            // Get events from cache
            const events: any[] = [];
            for (const id of cachedIds) {
                const event = await this.getSecurityEventFromCache(id);
                if (event) {
                    events.push(event);
                }
            }
            if (events.length > 0) {
                return events.map(event => this.mapToResponseDto(event));
            }
        }

        // Fallback to database
        const events = await this.prisma.securityEvent.findMany({
            where: { sessionToken },
            orderBy: { createdAt: 'desc' },
        });

        // Cache all events and user/session mapping
        for (const event of events) {
            await this.cacheSecurityEvent(event);
        }
        await this.cacheUserSecurityEventIds(sessionToken, events.map(e => e.id));

        return events.map(event => this.mapToResponseDto(event));
    }

    /**
     * Get security events by type - Cache-first
     */
    async getSecurityEventsByType(eventType: string): Promise<SecurityEventResponseDto[]> {
        // Try cache first
        const cacheKey = `${this.TYPE_CACHE_PREFIX}${eventType}`;
        const cachedIds = await this.getTypeSecurityEventIds(cacheKey);

        if (cachedIds && cachedIds.length > 0) {
            const events: any[] = [];
            for (const id of cachedIds) {
                const event = await this.getSecurityEventFromCache(id);
                if (event) {
                    events.push(event);
                }
            }

            if (events.length > 0) {
                return events.map(event => this.mapToResponseDto(event));
            }
        }

        // Fallback to database
        const events = await this.prisma.securityEvent.findMany({
            where: { eventType },
            orderBy: { createdAt: 'desc' },
        });

        // Cache results
        for (const event of events) {
            await this.cacheSecurityEvent(event);
        }
        await this.setTypeSecurityEventIds(cacheKey, events.map(e => e.id));

        return events.map(event => this.mapToResponseDto(event));
    }

    /**
     * Get security events by severity - Cache-first
     */
    async getSecurityEventsBySeverity(severity: string): Promise<SecurityEventResponseDto[]> {
        // Try cache first
        const cacheKey = `${this.SEVERITY_CACHE_PREFIX}${severity}`;
        const cachedIds = await this.getSeveritySecurityEventIds(cacheKey);

        if (cachedIds && cachedIds.length > 0) {
            const events: any[] = [];
            for (const id of cachedIds) {
                const event = await this.getSecurityEventFromCache(id);
                if (event) {
                    events.push(event);
                }
            }

            if (events.length > 0) {
                return events.map(event => this.mapToResponseDto(event));
            }
        }

        // Fallback to database
        const events = await this.prisma.securityEvent.findMany({
            where: { severity },
            orderBy: { createdAt: 'desc' },
        });

        // Cache results
        for (const event of events) {
            await this.cacheSecurityEvent(event);
        }
        await this.setSeveritySecurityEventIds(cacheKey, events.map(e => e.id));

        return events.map(event => this.mapToResponseDto(event));
    }

    /**
     * Get security event analytics - Cache-first
     */
    async getSecurityEventAnalytics(filters: SecurityEventAnalyticsDto): Promise<any> {
        this.logger.log('Getting security event analytics', 'SecurityEventsService');

        // Try cache first
        const cacheKey = `analytics:security_analytics:${JSON.stringify(filters)}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        // Queue analytics generation if not in cache
        await this.analyticsQueue.add('generate_security_analytics', {
            filters,
            cacheKey,
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000,
        });

        // Return cached result or empty result
        return cached ? JSON.parse(cached) : {
            totalEvents: 0,
            highSeverityEvents: 0,
            resolvedEvents: 0,
            averageRiskScore: 0,
            topEventTypes: [],
            topThreatLevels: [],
        };
    }

    /**
     * Bulk create security events - Cache-first, queue-driven
     */
    async bulkCreateSecurityEvents(events: CreateSecurityEventDto[]): Promise<number> {
        this.logger.log(`Bulk creating ${events.length} security events`, 'SecurityEventsService');

        try {
            const createdEvents: any[] = [];
            const timestamp = new Date().toISOString();

            // Create all events in cache first
            for (const dto of events) {
                const eventId = this.generateSecureId();
                const event: any = {
                    id: eventId,
                    sessionToken: dto.sessionToken,
                    eventType: dto.eventType,
                    severity: dto.severity || 'LOW',
                    description: dto.description,
                    ipAddress: dto.ipAddress,
                    userAgent: dto.userAgent,
                    deviceFingerprint: dto.deviceFingerprint,
                    location: dto.location,
                    riskScore: dto.riskScore,
                    threatIndicators: dto.threatIndicators,
                    mitigationActions: dto.mitigationActions,
                    metadata: dto.metadata,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                };

                // Cache immediately
                await this.cacheSecurityEvent(event);
                await this.cacheUserSecurityEvent(dto.sessionToken, eventId);
                await this.cacheTypeSecurityEvent(dto.eventType, eventId);
                await this.cacheSeveritySecurityEvent(event.severity, eventId);

                createdEvents.push(event);
            }

            // Queue bulk database write
            await this.analyticsQueue.add('bulk_security_events_created', {
                events: createdEvents,
                timestamp,
            }, {
                delay: 2000, // 2 second delay
            });

            this.logger.log(`Bulk created ${createdEvents.length} security events in cache and queued`, 'SecurityEventsService');

            return createdEvents.length;
        } catch (error) {
            this.logger.error(`Failed to bulk create security events: ${error.message}`, 'SecurityEventsService', error);
            throw new BadRequestException('Failed to bulk create security events');
        }
    }

    /**
     * Cache security event data
     */
    private async cacheSecurityEvent(event: any): Promise<void> {
        try {
            const cacheKey = `${this.EVENT_CACHE_PREFIX}${event.id}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(event));
        } catch (error) {
            this.logger.warn(`Failed to cache security event: ${error.message}`, 'SecurityEventsService');
        }
    }

    /**
     * Get security event from cache
     */
    private async getSecurityEventFromCache(eventId: string): Promise<any | null> {
        try {
            const cacheKey = `${this.EVENT_CACHE_PREFIX}${eventId}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get security event from cache: ${error.message}`, 'SecurityEventsService');
            return null;
        }
    }

    /**
     * Cache user security event mapping
     */
    private async cacheUserSecurityEvent(sessionToken: string, eventId: string): Promise<void> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${sessionToken}`;
            const existingIds = await this.getUserSecurityEventIds(sessionToken);
            const updatedIds = existingIds ? [...existingIds, eventId] : [eventId];
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(updatedIds));
        } catch (error) {
            this.logger.warn(`Failed to cache user security event: ${error.message}`, 'SecurityEventsService');
        }
    }

    /**
     * Get user security event IDs
     */
    private async getUserSecurityEventIds(sessionToken: string): Promise<string[] | null> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${sessionToken}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get user security event IDs: ${error.message}`, 'SecurityEventsService');
            return null;
        }
    }

    /**
     * Cache user security event IDs
     */
    private async cacheUserSecurityEventIds(sessionToken: string, eventIds: string[]): Promise<void> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${sessionToken}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(eventIds));
        } catch (error) {
            this.logger.warn(`Failed to cache user security event IDs: ${error.message}`, 'SecurityEventsService');
        }
    }

    /**
     * Cache type security event mapping
     */
    private async cacheTypeSecurityEvent(eventType: string, eventId: string): Promise<void> {
        try {
            const cacheKey = `${this.TYPE_CACHE_PREFIX}${eventType}`;
            const existingIds = await this.getTypeSecurityEventIds(cacheKey);
            const updatedIds = existingIds ? [...existingIds, eventId] : [eventId];
            await this.setTypeSecurityEventIds(cacheKey, updatedIds);
        } catch (error) {
            this.logger.warn(`Failed to cache type security event: ${error.message}`, 'SecurityEventsService');
        }
    }

    /**
     * Get type security event IDs
     */
    private async getTypeSecurityEventIds(cacheKey: string): Promise<string[] | null> {
        try {
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get type security event IDs: ${error.message}`, 'SecurityEventsService');
            return null;
        }
    }

    /**
     * Set type security event IDs
     */
    private async setTypeSecurityEventIds(cacheKey: string, eventIds: string[]): Promise<void> {
        try {
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(eventIds));
        } catch (error) {
            this.logger.warn(`Failed to set type security event IDs: ${error.message}`, 'SecurityEventsService');
        }
    }

    /**
     * Cache severity security event mapping
     */
    private async cacheSeveritySecurityEvent(severity: string, eventId: string): Promise<void> {
        try {
            const cacheKey = `${this.SEVERITY_CACHE_PREFIX}${severity}`;
            const existingIds = await this.getSeveritySecurityEventIds(cacheKey);
            const updatedIds = existingIds ? [...existingIds, eventId] : [eventId];
            await this.setSeveritySecurityEventIds(cacheKey, updatedIds);
        } catch (error) {
            this.logger.warn(`Failed to cache severity security event: ${error.message}`, 'SecurityEventsService');
        }
    }

    /**
     * Get severity security event IDs
     */
    private async getSeveritySecurityEventIds(cacheKey: string): Promise<string[] | null> {
        try {
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get severity security event IDs: ${error.message}`, 'SecurityEventsService');
            return null;
        }
    }

    /**
     * Set severity security event IDs
     */
    private async setSeveritySecurityEventIds(cacheKey: string, eventIds: string[]): Promise<void> {
        try {
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(eventIds));
        } catch (error) {
            this.logger.warn(`Failed to set severity security event IDs: ${error.message}`, 'SecurityEventsService');
        }
    }

    /**
     * Generate secure event ID for cache storage
     */
    private generateSecureId(): string {
        return `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Map to response DTO
     */
    private mapToResponseDto(event: any): SecurityEventResponseDto {
        return {
            id: event.id,
            sessionToken: event.sessionToken,
            eventType: event.eventType,
            severity: event.severity,
            description: event.description,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent ?? null,
            deviceFingerprint: event.deviceFingerprint ?? null,
            location: event.location ?? null,
            riskScore: event.riskScore,
            threatIndicators: event.threatIndicators ?? null,
            mitigationActions: event.mitigationActions ?? null,
            metadata: event.metadata ?? null,
            createdAt: event.createdAt,
        };
    }
} 