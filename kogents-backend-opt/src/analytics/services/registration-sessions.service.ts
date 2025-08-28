import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { SecureIdService } from '../../common/services/secure-id.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import {
    CreateSessionDto,
    UpdateSessionDto,
    SessionResponseDto,
    SessionAnalyticsDto
} from '../dtos/registration-sessions';

@Injectable()
export class RegistrationSessionsService {
    private readonly CACHE_TTL = 7200; // 2 hours
    private readonly SESSION_CACHE_PREFIX = 'analytics:session:';
    private readonly USER_CACHE_PREFIX = 'analytics:user:';
    private readonly STATUS_CACHE_PREFIX = 'analytics:status:';

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        private readonly secureIdService: SecureIdService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
    ) { }

    /**
     * Create registration session - Cache-first, queue-driven
     */
    async createSession(dto: CreateSessionDto): Promise<SessionResponseDto> {
        this.logger.log(`Creating registration session for IP: ${dto.ipAddress}`, 'RegistrationSessionsService');

        try {
            // Generate session token for cache storage
            const sessionToken = this.secureIdService.generateSessionId();
            const timestamp = new Date().toISOString();

            // Create session object for cache
            const session = {
                sessionToken,
                ipAddress: dto.ipAddress,
                userAgent: dto.userAgent,
                deviceFingerprint: dto.deviceFingerprint,
                country: dto.country,
                city: dto.city,
                timezone: dto.timezone,
                deviceType: dto.deviceType,
                browser: dto.browser,
                os: dto.os,
                screenResolution: dto.screenResolution,
                pageLoadTime: dto.pageLoadTime,
                formInteractionTime: dto.formInteractionTime,
                totalSessionTime: dto.totalSessionTime,
                riskScore: dto.riskScore || 0,
                isVpn: dto.isVpn || false,
                isTor: dto.isTor || false,
                isProxy: dto.isProxy || false,
                registrationSuccessful: false, // Default to false for new sessions
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            // Write to cache immediately
            await this.cacheSession(session);

            // Cache by IP for quick lookup
            await this.cacheIpSession(dto.ipAddress, sessionToken);

            // Cache by status for analytics
            await this.cacheStatusSession('pending', sessionToken);

            // Queue database write for background processing
            await this.analyticsQueue.add('session_created', {
                session,
                timestamp,
                priority: 'high',
            }, {
                delay: 1000, // 1 second delay for eventual consistency
            });

            // Queue analytics processing
            await this.analyticsQueue.add('session_analytics', {
                sessionToken,
                ipAddress: dto.ipAddress,
                registrationSuccessful: false,
                timestamp,
            }, {
                delay: 5000, // 5 second delay for analytics
            });

            this.logger.log(`Registration session cached and queued: ${sessionToken}`, 'RegistrationSessionsService');

            return this.mapToResponseDto(session);
        } catch (error) {
            this.logger.error(`Failed to create registration session: ${error.message}`, 'RegistrationSessionsService', error);
            throw new BadRequestException('Failed to create registration session');
        }
    }

    /**
     * Update registration session - Cache-first, queue-driven
     */
    async updateSession(sessionToken: string, dto: UpdateSessionDto): Promise<SessionResponseDto> {
        this.logger.log(`Updating registration session: ${sessionToken}`, 'RegistrationSessionsService');

        // Get from cache first
        let session = await this.getSessionFromCache(sessionToken);

        if (!session) {
            // Fallback to database if not in cache
            session = await this.prisma.registrationSession.findUnique({
                where: { sessionToken },
            });

            if (!session) {
                throw new NotFoundException('Registration session not found');
            }

            // Cache the found session
            await this.cacheSession(session);
        }

        // Update session object
        const updatedSession = {
            ...session,
            currentStep: dto.currentStep,
            completionPercentage: dto.completionPercentage,
            pageLoadTime: dto.pageLoadTime,
            formInteractionTime: dto.formInteractionTime,
            totalSessionTime: dto.totalSessionTime,
            riskScore: dto.riskScore,
            isVpn: dto.isVpn,
            isTor: dto.isTor,
            isProxy: dto.isProxy,
            registrationSuccessful: dto.registrationSuccessful,
            failureReason: dto.failureReason,
            completedAt: dto.completedAt,
            abandonedAt: dto.abandonedAt,
            updatedAt: new Date().toISOString(),
        };

        // Update cache immediately
        await this.cacheSession(updatedSession);

        // Queue database update for background processing
        await this.analyticsQueue.add('session_updated', {
            sessionToken,
            updateData: {
                currentStep: dto.currentStep,
                completionPercentage: dto.completionPercentage,
                pageLoadTime: dto.pageLoadTime,
                formInteractionTime: dto.formInteractionTime,
                totalSessionTime: dto.totalSessionTime,
                riskScore: dto.riskScore,
                isVpn: dto.isVpn,
                isTor: dto.isTor,
                isProxy: dto.isProxy,
                registrationSuccessful: dto.registrationSuccessful,
                failureReason: dto.failureReason,
                completedAt: dto.completedAt,
                abandonedAt: dto.abandonedAt,
            },
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000, // 1 second delay
        });

        // Queue analytics update
        await this.analyticsQueue.add('session_analytics_update', {
            sessionToken,
            currentStep: dto.currentStep,
            timestamp: new Date().toISOString(),
        }, {
            delay: 5000, // 5 second delay
        });

        this.logger.log(`Registration session updated in cache and queued: ${sessionToken}`, 'RegistrationSessionsService');

        return this.mapToResponseDto(updatedSession);
    }

    /**
     * Complete registration session - Mark as successful
     */
    async completeSession(sessionToken: string, failureReason?: string): Promise<SessionResponseDto> {
        this.logger.log(`Completing registration session: ${sessionToken}`, 'RegistrationSessionsService');

        const timestamp = new Date().toISOString();
        const updateData = {
            registrationSuccessful: true,
            completedAt: timestamp,
            failureReason: failureReason || undefined,
        };

        return this.updateSession(sessionToken, updateData);
    }

    /**
     * Abandon registration session - Mark as failed
     */
    async abandonSession(sessionToken: string, failureReason: string): Promise<SessionResponseDto> {
        this.logger.log(`Abandoning registration session: ${sessionToken}`, 'RegistrationSessionsService');

        const timestamp = new Date().toISOString();
        const updateData = {
            registrationSuccessful: false,
            abandonedAt: timestamp,
            failureReason,
        };

        return this.updateSession(sessionToken, updateData);
    }

    /**
     * Mark session as successful
     */
    async markSuccessful(sessionToken: string): Promise<SessionResponseDto> {
        return this.completeSession(sessionToken);
    }

    /**
     * Mark session as failed
     */
    async markFailed(sessionToken: string, failureReason: string): Promise<SessionResponseDto> {
        return this.abandonSession(sessionToken, failureReason);
    }

    /**
     * Get registration session by token - Cache-first
     */
    async getSession(sessionToken: string): Promise<SessionResponseDto> {
        // Try cache first
        let session = await this.getSessionFromCache(sessionToken);

        if (!session) {
            // Fallback to database
            session = await this.prisma.registrationSession.findUnique({
                where: { sessionToken },
            });

            if (!session) {
                throw new NotFoundException('Registration session not found');
            }

            // Cache for future requests
            await this.cacheSession(session);
        }

        return this.mapToResponseDto(session);
    }

    /**
     * Get sessions by IP address - Cache-first
     */
    async getSessionsByIp(ipAddress: string): Promise<SessionResponseDto[]> {
        // Try to get session tokens from IP cache
        const cachedTokens = await this.getIpSessionTokens(ipAddress);

        if (cachedTokens && cachedTokens.length > 0) {
            // Get sessions from cache
            const sessions: any[] = [];
            for (const token of cachedTokens) {
                const session = await this.getSessionFromCache(token);
                if (session) {
                    sessions.push(session);
                }
            }

            if (sessions.length > 0) {
                return sessions.map(session => this.mapToResponseDto(session));
            }
        }

        // Fallback to database
        const sessions = await this.prisma.registrationSession.findMany({
            where: { ipAddress },
            orderBy: { createdAt: 'desc' },
        });

        // Cache all sessions and IP mapping
        for (const session of sessions) {
            await this.cacheSession(session);
        }
        await this.cacheIpSessionTokens(ipAddress, sessions.map(s => s.sessionToken));

        return sessions.map(session => this.mapToResponseDto(session));
    }

    /**
     * Get sessions by status - Cache-first
     */
    async getSessionsByStatus(status: 'successful' | 'pending' | 'failed'): Promise<SessionResponseDto[]> {
        // Try cache first
        const cacheKey = `${this.STATUS_CACHE_PREFIX}${status}`;
        const cachedTokens = await this.getStatusSessionTokens(cacheKey);

        if (cachedTokens && cachedTokens.length > 0) {
            const sessions: any[] = [];
            for (const token of cachedTokens) {
                const session = await this.getSessionFromCache(token);
                if (session) {
                    sessions.push(session);
                }
            }

            if (sessions.length > 0) {
                return sessions.map(session => this.mapToResponseDto(session));
            }
        }

        // Fallback to database
        const sessions = await this.prisma.registrationSession.findMany({
            where: { registrationSuccessful: status === 'successful' },
            orderBy: { createdAt: 'desc' },
        });

        // Cache results
        for (const session of sessions) {
            await this.cacheSession(session);
        }
        await this.setStatusSessionTokens(cacheKey, sessions.map(s => s.sessionToken));

        return sessions.map(session => this.mapToResponseDto(session));
    }

    /**
     * Get session analytics - Cache-first
     */
    async getSessionAnalytics(filters: SessionAnalyticsDto): Promise<any> {
        this.logger.log('Getting session analytics', 'RegistrationSessionsService');

        // Try cache first
        const cacheKey = `analytics:session_analytics:${JSON.stringify(filters)}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        // Queue analytics generation if not in cache
        await this.analyticsQueue.add('generate_session_analytics', {
            filters,
            cacheKey,
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000,
        });

        // Return cached result or empty result
        return cached ? JSON.parse(cached) : {
            totalSessions: 0,
            successfulRegistrations: 0,
            conversionRate: 0,
            averageSessionDuration: 0,
            topCountries: [],
            topDevices: [],
        };
    }

    /**
     * Bulk create sessions - Cache-first, queue-driven
     */
    async bulkCreateSessions(sessions: CreateSessionDto[]): Promise<number> {
        this.logger.log(`Bulk creating ${sessions.length} sessions`, 'RegistrationSessionsService');

        try {
            const createdSessions: any[] = [];
            const timestamp = new Date().toISOString();

            // Create all sessions in cache first
            for (const dto of sessions) {
                const sessionToken = this.secureIdService.generateSessionId();
                const session: any = {
                    sessionToken,
                    ipAddress: dto.ipAddress,
                    userAgent: dto.userAgent,
                    deviceFingerprint: dto.deviceFingerprint,
                    country: dto.country,
                    city: dto.city,
                    timezone: dto.timezone,
                    deviceType: dto.deviceType,
                    browser: dto.browser,
                    os: dto.os,
                    screenResolution: dto.screenResolution,
                    pageLoadTime: dto.pageLoadTime,
                    formInteractionTime: dto.formInteractionTime,
                    totalSessionTime: dto.totalSessionTime,
                    riskScore: dto.riskScore || 0,
                    isVpn: dto.isVpn || false,
                    isTor: dto.isTor || false,
                    isProxy: dto.isProxy || false,
                    registrationSuccessful: false, // Default to false for new sessions
                    createdAt: timestamp,
                    updatedAt: timestamp,
                };

                // Cache immediately
                await this.cacheSession(session);
                await this.cacheIpSession(dto.ipAddress, sessionToken);
                await this.cacheStatusSession('pending', sessionToken);

                createdSessions.push(session);
            }

            // Queue bulk database write
            await this.analyticsQueue.add('bulk_sessions_created', {
                sessions: createdSessions,
                timestamp,
            }, {
                delay: 2000, // 2 second delay
            });

            this.logger.log(`Bulk created ${createdSessions.length} sessions in cache and queued`, 'RegistrationSessionsService');

            return createdSessions.length;
        } catch (error) {
            this.logger.error(`Failed to bulk create sessions: ${error.message}`, 'RegistrationSessionsService', error);
            throw new BadRequestException('Failed to bulk create sessions');
        }
    }

    /**
     * Cache session data
     */
    private async cacheSession(session: any): Promise<void> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${session.sessionToken}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(session));
        } catch (error) {
            this.logger.warn(`Failed to cache session: ${error.message}`, 'RegistrationSessionsService');
        }
    }

    /**
     * Get session from cache
     */
    private async getSessionFromCache(sessionToken: string): Promise<any | null> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionToken}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get session from cache: ${error.message}`, 'RegistrationSessionsService');
            return null;
        }
    }

    /**
     * Get user session tokens
     */
    private async getUserSessionTokens(userId: string): Promise<string[] | null> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get user session tokens: ${error.message}`, 'RegistrationSessionsService');
            return null;
        }
    }

    /**
     * Cache user session tokens
     */
    private async cacheUserSessionTokens(userId: string, sessionTokens: string[]): Promise<void> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(sessionTokens));
        } catch (error) {
            this.logger.warn(`Failed to cache user session tokens: ${error.message}`, 'RegistrationSessionsService');
        }
    }

    /**
     * Cache status session mapping
     */
    private async cacheStatusSession(status: string, sessionToken: string): Promise<void> {
        try {
            const cacheKey = `${this.STATUS_CACHE_PREFIX}${status}`;
            const existingTokens = await this.getStatusSessionTokens(cacheKey);
            const updatedTokens = existingTokens ? [...existingTokens, sessionToken] : [sessionToken];
            await this.setStatusSessionTokens(cacheKey, updatedTokens);
        } catch (error) {
            this.logger.warn(`Failed to cache status session: ${error.message}`, 'RegistrationSessionsService');
        }
    }

    /**
     * Get status session tokens
     */
    private async getStatusSessionTokens(cacheKey: string): Promise<string[] | null> {
        try {
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get status session tokens: ${error.message}`, 'RegistrationSessionsService');
            return null;
        }
    }

    /**
     * Set status session tokens
     */
    private async setStatusSessionTokens(cacheKey: string, sessionTokens: string[]): Promise<void> {
        try {
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(sessionTokens));
        } catch (error) {
            this.logger.warn(`Failed to set status session tokens: ${error.message}`, 'RegistrationSessionsService');
        }
    }

    /**
     * Update status cache when registration status changes
     */
    private async updateStatusCache(oldStatus: string, sessionToken: string, newStatus: string): Promise<void> {
        try {
            // Remove from old status cache
            const oldCacheKey = `${this.STATUS_CACHE_PREFIX}${oldStatus}`;
            const oldTokens = await this.getStatusSessionTokens(oldCacheKey);
            if (oldTokens) {
                const updatedOldTokens = oldTokens.filter(token => token !== sessionToken);
                await this.setStatusSessionTokens(oldCacheKey, updatedOldTokens);
            }

            // Add to new status cache
            await this.cacheStatusSession(newStatus, sessionToken);
        } catch (error) {
            this.logger.warn(`Failed to update status cache: ${error.message}`, 'RegistrationSessionsService');
        }
    }

    /**
     * Cache IP session mapping
     */
    private async cacheIpSession(ipAddress: string, sessionToken: string): Promise<void> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${ipAddress}`;
            const existingTokens = await this.getIpSessionTokens(ipAddress);
            const updatedTokens = existingTokens ? [...existingTokens, sessionToken] : [sessionToken];
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(updatedTokens));
        } catch (error) {
            this.logger.warn(`Failed to cache IP session: ${error.message}`, 'RegistrationSessionsService');
        }
    }

    /**
     * Get IP session tokens
     */
    private async getIpSessionTokens(ipAddress: string): Promise<string[] | null> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${ipAddress}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get IP session tokens: ${error.message}`, 'RegistrationSessionsService');
            return null;
        }
    }

    /**
     * Cache IP session tokens
     */
    private async cacheIpSessionTokens(ipAddress: string, sessionTokens: string[]): Promise<void> {
        try {
            const cacheKey = `${this.USER_CACHE_PREFIX}${ipAddress}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(sessionTokens));
        } catch (error) {
            this.logger.warn(`Failed to cache IP session tokens: ${error.message}`, 'RegistrationSessionsService');
        }
    }

    /**
     * Map to response DTO
     */
    private mapToResponseDto(session: any): SessionResponseDto {
        return {
            id: session.id,
            sessionToken: session.sessionToken,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            deviceFingerprint: session.deviceFingerprint,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            abandonedAt: session.abandonedAt,
            currentStep: session.currentStep,
            totalSteps: session.totalSteps,
            completionPercentage: session.completionPercentage,
            pageLoadTime: session.pageLoadTime,
            formInteractionTime: session.formInteractionTime,
            totalSessionTime: session.totalSessionTime,
            country: session.country,
            city: session.city,
            timezone: session.timezone,
            deviceType: session.deviceType,
            browser: session.browser,
            os: session.os,
            screenResolution: session.screenResolution,
            riskScore: session.riskScore,
            isVpn: session.isVpn,
            isTor: session.isTor,
            isProxy: session.isProxy,
            registrationSuccessful: session.registrationSuccessful,
            failureReason: session.failureReason,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }
} 