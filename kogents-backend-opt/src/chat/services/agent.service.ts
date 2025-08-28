import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

@Injectable()
export class AgentService implements OnModuleDestroy {
    // Redis key constants for consistency and maintainability
    private readonly REDIS_KEYS = {
        // Agent status keys
        AGENT_STATUS: (agentId: string) => `agent:${agentId}:status`,
        AGENT_STATUS_FIELDS: {
            AGENT_ID: 'agentId',
            WORKSPACE_ID: 'workspaceId',
            STATUS: 'status',
            SOCKET_ID: 'socketId',
            CURRENT_ROOM_ID: 'currentRoomId',
            LAST_UPDATED: 'lastUpdated',
            MAX_CONCURRENT_CHATS: 'maxConcurrentChats',
            CURRENT_CHATS: 'currentChats'
        },

        // Workspace agent management keys
        WORKSPACE_AGENTS: (workspaceId: string) => `workspace:${workspaceId}:agents`,
        WORKSPACE_AVAILABLE_AGENTS: (workspaceId: string) => `workspace:${workspaceId}:available_agents`,

        // Agent activity tracking keys
        AGENT_ACTIVITY: (agentId: string) => `agent:${agentId}:activity`,
        AGENT_ROOMS: (agentId: string) => `agent:${agentId}:rooms`,

        // Agent performance keys
        AGENT_PERFORMANCE: (agentId: string, workspaceId: string) => `agent:${agentId}:workspace:${workspaceId}:performance`,
        AGENT_RESPONSE_TIMES: (agentId: string) => `agent:${agentId}:response_times`,

        // Agent availability routing keys
        AGENT_AVAILABILITY: (workspaceId: string) => `workspace:${workspaceId}:agent_availability`,
        AGENT_DEPARTMENT_ROUTING: (workspaceId: string, departmentId: string) => `workspace:${workspaceId}:department:${departmentId}:agents`,
    };

    // Redis expiration times (in seconds)
    private readonly REDIS_EXPIRATIONS = {
        AGENT_STATUS: 3600, // 1 hour
        WORKSPACE_AGENTS: 3600, // 1 hour
        AVAILABLE_AGENTS: 300, // 5 minutes
        AGENT_ACTIVITY: 86400, // 24 hours
        AGENT_PERFORMANCE: 7200, // 2 hours
        AGENT_ROOMS: 1800, // 30 minutes
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('CHAT_ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
    ) { }

    // Circuit breaker for Redis operations
    private redisFailureCount = 0;
    private readonly MAX_REDIS_FAILURES = 5;
    private readonly REDIS_CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
    private redisCircuitBreakerOpen = false;
    private redisCircuitBreakerOpenTime = 0;

    async updateAgentStatus(
        agentId: string,
        workspaceId: string | null,
        data: {
            status?: string;
            currentRoomId?: string;
            maxConcurrentChats?: number;
            currentChats?: number;
        }
    ) {
        try {
            // 1. CACHE FIRST - Store agent status immediately for real-time access
            await this.safeRedisOperation(async () => {
                const statusKey = this.REDIS_KEYS.AGENT_STATUS(agentId);
                const statusData = {
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.AGENT_ID]: agentId,
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.WORKSPACE_ID]: workspaceId || '',
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.STATUS]: data.status || 'OFFLINE',
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.CURRENT_ROOM_ID]: data.currentRoomId || '',
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.LAST_UPDATED]: new Date().toISOString(),
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.MAX_CONCURRENT_CHATS]: data.maxConcurrentChats?.toString() || '5',
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.CURRENT_CHATS]: data.currentChats?.toString() || '0',
                };

                await this.redis.hset(statusKey, statusData);
                await this.redis.expire(statusKey, this.REDIS_EXPIRATIONS.AGENT_STATUS);

                // Update workspace agent list if workspace provided
                if (workspaceId) {
                    const workspaceAgentsKey = this.REDIS_KEYS.WORKSPACE_AGENTS(workspaceId);
                    await this.redis.zadd(workspaceAgentsKey, Date.now(), agentId);
                    await this.redis.expire(workspaceAgentsKey, this.REDIS_EXPIRATIONS.WORKSPACE_AGENTS);

                    // Update availability index for routing
                    const availableAgentsKey = this.REDIS_KEYS.WORKSPACE_AVAILABLE_AGENTS(workspaceId);
                    if (data.status === 'ONLINE') {
                        await this.redis.sadd(availableAgentsKey, agentId);
                    } else {
                        await this.redis.srem(availableAgentsKey, agentId);
                    }
                    await this.redis.expire(availableAgentsKey, this.REDIS_EXPIRATIONS.AVAILABLE_AGENTS);
                }
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'agent_status_updated',
                agentId,
                workspaceId,
                statusData: data,
                timestamp: new Date(),
            });

            this.logger.log(`Agent ${agentId} status cached and queued for persistence`, 'AgentService');
            return { success: true };
        } catch (error) {
            this.logger.error(`Update agent status error: ${error.message}`, 'AgentService');
            throw error;
        }
    }

    async getAgentStatus(agentId: string) {
        try {
            // Try cache first
            const cachedStatus = await this.safeRedisOperation(async () => {
                const statusKey = this.REDIS_KEYS.AGENT_STATUS(agentId);
                const statusData = await this.redis.hgetall(statusKey);

                if (statusData && Object.keys(statusData).length > 0) {
                    return {
                        agentId: statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.AGENT_ID],
                        workspaceId: statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.WORKSPACE_ID] || null,
                        status: statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.STATUS] || 'OFFLINE',
                        socketId: statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.SOCKET_ID] || null,
                        currentRoomId: statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.CURRENT_ROOM_ID] || null,
                        lastUpdated: statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.LAST_UPDATED] ? new Date(statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.LAST_UPDATED]) : new Date(),
                        maxConcurrentChats: parseInt(statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.MAX_CONCURRENT_CHATS] || '5'),
                        currentChats: parseInt(statusData[this.REDIS_KEYS.AGENT_STATUS_FIELDS.CURRENT_CHATS] || '0'),
                    };
                }
                return null;
            });

            if (cachedStatus) {
                this.logger.log(`Agent ${agentId} status retrieved from cache`, 'AgentService');
                return cachedStatus;
            }

            // Fallback to database if not in cache
            const dbAgentStatus = await this.prisma.agentStatus.findUnique({
                where: { userId: agentId },
            });

            if (!dbAgentStatus) {
                this.logger.warn(`Agent ${agentId} status not found in database`, 'AgentService');
                return null;
            }

            // Transform database result to match cache format
            const transformedStatus = {
                agentId: dbAgentStatus.userId,
                workspaceId: dbAgentStatus.workspaceId,
                status: dbAgentStatus.status,
                socketId: null, // Not stored in database
                currentRoomId: dbAgentStatus.currentRoomId,
                lastUpdated: dbAgentStatus.statusChangedAt,
                maxConcurrentChats: dbAgentStatus.maxConcurrentChats,
                currentChats: dbAgentStatus.currentChats,
            };

            // Cache the database result for future requests
            await this.safeRedisOperation(async () => {
                const statusKey = this.REDIS_KEYS.AGENT_STATUS(agentId);
                const statusData = {
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.AGENT_ID]: transformedStatus.agentId,
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.WORKSPACE_ID]: transformedStatus.workspaceId || '',
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.STATUS]: transformedStatus.status,
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.SOCKET_ID]: transformedStatus.socketId || '',
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.CURRENT_ROOM_ID]: transformedStatus.currentRoomId || '',
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.LAST_UPDATED]: transformedStatus.lastUpdated.toISOString(),
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.MAX_CONCURRENT_CHATS]: transformedStatus.maxConcurrentChats.toString(),
                    [this.REDIS_KEYS.AGENT_STATUS_FIELDS.CURRENT_CHATS]: transformedStatus.currentChats.toString(),
                };

                await this.redis.hset(statusKey, statusData);
                await this.redis.expire(statusKey, this.REDIS_EXPIRATIONS.AGENT_STATUS);
            });

            this.logger.log(`Agent ${agentId} status retrieved from database and cached`, 'AgentService');
            return transformedStatus;
        } catch (error) {
            this.logger.error(`Get agent status error: ${error.message}`, 'AgentService');
            throw error;
        }
    }

    // Safe Redis operation wrapper
    private async safeRedisOperation<T>(operation: () => Promise<T>): Promise<T | null> {
        // Check circuit breaker
        if (this.redisCircuitBreakerOpen) {
            const timeSinceOpen = Date.now() - this.redisCircuitBreakerOpenTime;
            if (timeSinceOpen < this.REDIS_CIRCUIT_BREAKER_TIMEOUT) {
                return null;
            } else {
                // Reset circuit breaker
                this.redisCircuitBreakerOpen = false;
                this.redisFailureCount = 0;
                this.logger.log(`Redis circuit breaker reset`, 'AgentService');
            }
        }

        try {
            const result = await operation();
            this.redisFailureCount = 0; // Reset on success
            return result;
        } catch (error) {
            this.redisFailureCount++;
            if (this.redisFailureCount >= this.MAX_REDIS_FAILURES) {
                this.redisCircuitBreakerOpen = true;
                this.redisCircuitBreakerOpenTime = Date.now();
                this.logger.error(`Redis circuit breaker opened after ${this.redisFailureCount} failures`, 'AgentService');
            }
            this.logger.error(`Redis operation failed: ${error.message}`, 'AgentService');
            return null;
        }
    }

    onModuleDestroy() {
        // Clean shutdown - no timers to clear anymore since we use BullMQ
        this.logger.log('AgentService shutting down', 'AgentService');
    }
} 