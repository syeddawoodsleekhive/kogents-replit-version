import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('CHAT_ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
    ) { }

    async updateChatAnalytics(roomId: string, data: any): Promise<void> {
        try {
            // Cache analytics update immediately
            await this.cacheChatAnalytics(roomId, data);

            // Queue for batch database update
            await this.addToAnalyticsUpdateQueue(roomId, data);

            this.logger.log(`Chat analytics updated for room ${roomId}`, 'AnalyticsService');
        } catch (error) {
            this.logger.error(`Update chat analytics error: ${error.message}`, 'AnalyticsService');
            throw error;
        }
    }

    async getChatAnalytics(roomId: string): Promise<any> {
        try {
            // Try cache first
            const cacheKey = `chat:analytics:${roomId}`;
            const cachedAnalytics = await this.redis.get(cacheKey);

            if (cachedAnalytics) {
                return JSON.parse(cachedAnalytics);
            }

            // If not in cache, fetch from DB
            const analytics = await this.prisma.chatAnalytics.findUnique({
                where: { roomId },
            });

            if (analytics) {
                // Cache for 30 minutes
                await this.redis.setex(cacheKey, 1800, JSON.stringify(analytics));
            }

            return analytics;
        } catch (error) {
            this.logger.error(`Get chat analytics error: ${error.message}`, 'AnalyticsService');
            throw error;
        }
    }

    async getWorkspaceAnalytics(workspaceId: string, timeRange: string): Promise<any> {
        try {
            // Try cache first
            const cacheKey = `chat:workspace:${workspaceId}:analytics:${timeRange}`;
            const cachedAnalytics = await this.redis.get(cacheKey);

            if (cachedAnalytics) {
                return JSON.parse(cachedAnalytics);
            }

            // If not in cache, calculate from DB
            const analytics = await this.calculateWorkspaceAnalytics(workspaceId, timeRange);

            // Cache for 15 minutes
            await this.redis.setex(cacheKey, 900, JSON.stringify(analytics));

            return analytics;
        } catch (error) {
            this.logger.error(`Get workspace analytics error: ${error.message}`, 'AnalyticsService');
            throw error;
        }
    }

    async getAgentPerformanceMetrics(workspaceId: string, timeRange: string): Promise<any[]> {
        try {
            // Try cache first
            const cacheKey = `chat:workspace:${workspaceId}:agent_performance:${timeRange}`;
            const cachedMetrics = await this.redis.get(cacheKey);

            if (cachedMetrics) {
                return JSON.parse(cachedMetrics);
            }

            // If not in cache, calculate from DB
            const metrics = await this.calculateAgentPerformanceMetrics(workspaceId, timeRange);

            // Cache for 10 minutes
            await this.redis.setex(cacheKey, 600, JSON.stringify(metrics));

            return metrics;
        } catch (error) {
            this.logger.error(`Get agent performance metrics error: ${error.message}`, 'AnalyticsService');
            throw error;
        }
    }

    async getVisitorAnalytics(workspaceId: string, timeRange: string): Promise<any> {
        try {
            // Try cache first
            const cacheKey = `chat:workspace:${workspaceId}:visitor_analytics:${timeRange}`;
            const cachedAnalytics = await this.redis.get(cacheKey);

            if (cachedAnalytics) {
                return JSON.parse(cachedAnalytics);
            }

            // If not in cache, calculate from DB
            const analytics = await this.calculateVisitorAnalytics(workspaceId, timeRange);

            // Cache for 15 minutes
            await this.redis.setex(cacheKey, 900, JSON.stringify(analytics));

            return analytics;
        } catch (error) {
            this.logger.error(`Get visitor analytics error: ${error.message}`, 'AnalyticsService');
            throw error;
        }
    }

    // Redis Caching Methods
    private async cacheChatAnalytics(roomId: string, data: any) {
        try {
            const cacheKey = `chat:analytics:${roomId}`;
            const analyticsData = {
                roomId,
                ...data,
                lastUpdated: new Date(),
            };

            // Cache for 30 minutes with fallback for Redis failures
            try {
                await this.redis.setex(cacheKey, 1800, JSON.stringify(analyticsData));
            } catch (cacheError) {
                this.logger.warn(`Failed to cache chat analytics: ${cacheError.message}`, 'AnalyticsService');
                // Continue without caching - system still works
            }
        } catch (error) {
            this.logger.error(`Cache chat analytics error: ${error.message}`, 'AnalyticsService');
        }
    }

    // Batch Database Operations
    private analyticsUpdateQueue: any[] = [];
    private analyticsQueueTimer: NodeJS.Timeout | null = null;
    private readonly BATCH_INTERVAL = 10000; // 10 seconds
    private readonly MAX_BATCH_SIZE = 30;
    private readonly MAX_RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAYS = [2000, 8000, 20000]; // Exponential backoff delays

    private async addToAnalyticsUpdateQueue(roomId: string, data: any) {
        this.analyticsUpdateQueue.push({ roomId, data });

        // Start timer if not already running
        if (!this.analyticsQueueTimer) {
            this.analyticsQueueTimer = setTimeout(() => {
                this.processAnalyticsUpdateQueue();
            }, this.BATCH_INTERVAL);
        }

        // Process immediately if queue is full
        if (this.analyticsUpdateQueue.length >= this.MAX_BATCH_SIZE) {
            this.processAnalyticsUpdateQueue();
        }
    }

    private async processAnalyticsUpdateQueue() {
        if (this.analyticsUpdateQueue.length === 0) return;

        const updates = [...this.analyticsUpdateQueue];
        this.analyticsUpdateQueue = [];

        try {
            // Add timeout for database operations
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Database operation timeout')), 15000); // 15 second timeout
            });

            const dbOperation = this.prisma.$transaction(
                updates.map(update =>
                    this.prisma.chatAnalytics.upsert({
                        where: { roomId: update.roomId },
                        update: update.data,
                        create: {
                            roomId: update.roomId,
                            ...update.data,
                        },
                    })
                )
            );

            // Race between timeout and database operation
            await Promise.race([dbOperation, timeoutPromise]);

            this.logger.log(`Batch updated ${updates.length} chat analytics`, 'AnalyticsService');
        } catch (error) {
            this.logger.error(`Process analytics update queue error: ${error.message}`, 'AnalyticsService');

            // Implement retry logic with exponential backoff
            const retryCount = updates[0]?.retryCount || 0;
            if (retryCount < this.MAX_RETRY_ATTEMPTS) {
                // Add retry count and delay to updates
                const retryUpdates = updates.map(update => ({
                    ...update,
                    retryCount: retryCount + 1,
                    retryDelay: this.RETRY_DELAYS[retryCount] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1]
                }));

                // Re-add to queue with delay
                setTimeout(() => {
                    this.analyticsUpdateQueue.unshift(...retryUpdates);
                }, retryUpdates[0].retryDelay);

                this.logger.warn(`Retrying ${updates.length} analytics updates (attempt ${retryCount + 1}/${this.MAX_RETRY_ATTEMPTS})`, 'AnalyticsService');
            } else {
                this.logger.error(`Failed to process ${updates.length} analytics updates after ${this.MAX_RETRY_ATTEMPTS} attempts`, 'AnalyticsService');
                // Log failed updates for manual intervention
                this.logger.error(`Failed analytics updates: ${JSON.stringify(updates)}`, 'AnalyticsService');
            }
        }
    }

    // Analytics Calculation Methods
    private async calculateWorkspaceAnalytics(workspaceId: string, timeRange: string): Promise<any> {
        try {
            // Calculate date range based on timeRange parameter
            const now = new Date();
            let startDate: Date;

            switch (timeRange) {
                case 'today':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'quarter':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to month
            }

            // Get all chat rooms in the workspace for the time range
            const chatRooms = await this.prisma.chatRoom.findMany({
                where: {
                    workspaceId,
                    createdAt: { gte: startDate },
                },
                include: {
                    messages: {
                        where: { createdAt: { gte: startDate } },
                    },
                    analytics: true,
                    participants: {
                        where: { role: 'agent' },
                    },
                },
            });

            // Calculate basic metrics
            const totalChats = chatRooms.length;
            const activeChats = chatRooms.filter(room => !room.endedAt).length;
            const resolvedChats = chatRooms.filter(room => room.endedAt).length;

            // Calculate message metrics
            const totalMessages = chatRooms.reduce((sum, room) => sum + room.messages.length, 0);
            const visitorMessages = chatRooms.reduce((sum, room) =>
                sum + room.messages.filter(msg => msg.senderType === 'visitor').length, 0);
            const agentMessages = chatRooms.reduce((sum, room) =>
                sum + room.messages.filter(msg => msg.senderType === 'agent').length, 0);

            // Calculate average response time from analytics
            const responseTimes = chatRooms
                .map(room => room.analytics?.averageResponseTime)
                .filter(time => time !== null && time !== undefined);

            const averageResponseTime = responseTimes.length > 0
                ? Math.round(responseTimes.reduce((sum, time) => sum + time!, 0) / responseTimes.length / 1000) // Convert to seconds
                : 0;

            // Calculate average chat duration
            const chatDurations = chatRooms
                .filter(room => room.endedAt)
                .map(room => {
                    const duration = room.endedAt!.getTime() - room.createdAt.getTime();
                    return Math.round(duration / 1000 / 60); // Convert to minutes
                });

            const averageChatDuration = chatDurations.length > 0
                ? Math.round(chatDurations.reduce((sum, duration) => sum + duration, 0) / chatDurations.length)
                : 0;

            // Calculate satisfaction score
            const ratings = chatRooms
                .map(room => room.analytics?.rating)
                .filter(rating => rating !== null && rating !== undefined);

            const satisfactionScore = ratings.length > 0
                ? Number((ratings.reduce((sum, rating) => sum + rating!, 0) / ratings.length).toFixed(1))
                : 0;

            // Generate daily stats for the time period
            const dailyStats = await this.generateWorkspaceDailyStats(workspaceId, startDate, now);

            // QUEUE WORKSPACE-LEVEL PERFORMANCE METRICS (background)
            await this.queueCalculatedWorkspaceMetrics(workspaceId, timeRange, {
                totalChats,
                activeChats,
                resolvedChats,
                averageResponseTime,
                averageChatDuration,
                totalMessages,
                visitorMessages,
                agentMessages,
                satisfactionScore,
            });

            return {
                workspaceId,
                timeRange,
                totalChats,
                activeChats,
                resolvedChats,
                averageResponseTime,
                averageChatDuration,
                totalMessages,
                visitorMessages,
                agentMessages,
                satisfactionScore,
                period: `${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
                dailyStats,
            };
        } catch (error) {
            this.logger.error(`Calculate workspace analytics error: ${error.message}`, 'AnalyticsService');
            // Return default values on error to prevent system failure
            return {
                workspaceId,
                timeRange,
                totalChats: 0,
                activeChats: 0,
                resolvedChats: 0,
                averageResponseTime: 0,
                averageChatDuration: 0,
                totalMessages: 0,
                visitorMessages: 0,
                agentMessages: 0,
                satisfactionScore: 0,
                period: `Error calculating for ${timeRange}`,
                dailyStats: [],
            };
        }
    }

    private async calculateAgentPerformanceMetrics(workspaceId: string, timeRange: string): Promise<any[]> {
        try {
            // Calculate date range
            const now = new Date();
            let startDate: Date;

            switch (timeRange) {
                case 'today':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            // Get all agents in workspace
            const agents = await this.prisma.user.findMany({
                where: {
                    workspaceId,
                    status: 'ACTIVE',
                    agentStatus: { isNot: null },
                },
                include: {
                    agentStatus: true,
                },
            });

            // Calculate performance for each agent
            const agentMetrics = await Promise.all(
                agents.map(async (agent) => {
                    // Get agent's chat rooms
                    const agentRooms = await this.prisma.chatRoom.findMany({
                        where: {
                            workspaceId,
                            OR: [
                                { primaryAgentId: agent.id },
                                {
                                    participants: {
                                        some: {
                                            userId: agent.id,
                                            role: 'agent',
                                        },
                                    },
                                },
                            ],
                            createdAt: { gte: startDate },
                        },
                        include: {
                            messages: {
                                where: {
                                    userId: agent.id,
                                    senderType: 'agent',
                                    createdAt: { gte: startDate },
                                },
                            },
                            analytics: true,
                        },
                    });

                    const totalChats = agentRooms.length;
                    const resolvedChats = agentRooms.filter(room => room.endedAt).length;
                    const totalMessages = agentRooms.reduce((sum, room) => sum + room.messages.length, 0);

                    // Calculate average response time
                    const responseTimes = agentRooms
                        .map(room => room.analytics?.averageResponseTime)
                        .filter(time => time !== null && time !== undefined);

                    const averageResponseTime = responseTimes.length > 0
                        ? Math.round(responseTimes.reduce((sum, time) => sum + time!, 0) / responseTimes.length / 1000)
                        : 0;

                    // Calculate satisfaction score
                    const ratings = agentRooms
                        .map(room => room.analytics?.rating)
                        .filter(rating => rating !== null && rating !== undefined);

                    const satisfactionScore = ratings.length > 0
                        ? Number((ratings.reduce((sum, rating) => sum + rating!, 0) / ratings.length).toFixed(1))
                        : 0;

                    return {
                        agentId: agent.id,
                        agentName: agent.name,
                        agentEmail: agent.email,
                        totalChats,
                        resolvedChats,
                        totalMessages,
                        averageResponseTime,
                        satisfactionScore,
                        currentStatus: agent.agentStatus?.status || 'offline',
                        availability: agent.agentStatus?.status || 'OFFLINE',
                    };
                })
            );

            // Sort by total chats descending
            agentMetrics.sort((a, b) => b.totalChats - a.totalChats);

            // QUEUE WORKSPACE-LEVEL PERFORMANCE METRICS (background)
            await this.queueWorkspacePerformanceMetrics(workspaceId, timeRange, agentMetrics);

            return agentMetrics;
        } catch (error) {
            this.logger.error(`Calculate agent performance metrics error: ${error.message}`, 'AnalyticsService');
            return [];
        }
    }

    private async calculateVisitorAnalytics(workspaceId: string, timeRange: string): Promise<any> {
        try {
            // Calculate date range
            const now = new Date();
            let startDate: Date;

            switch (timeRange) {
                case 'today':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            // Get visitor sessions for the time range
            const visitorSessions = await this.prisma.visitorSession.findMany({
                where: {
                    workspaceId,
                    startedAt: { gte: startDate },
                },
                include: {
                    chatRoom: {
                        include: {
                            messages: {
                                where: { createdAt: { gte: startDate } },
                            },
                        },
                    },
                },
            });

            // Calculate basic visitor metrics
            const totalVisitors = visitorSessions.length;
            const uniqueVisitors = new Set(visitorSessions.map(session => session.visitorId)).size;

            // Calculate returning visitors (visitors with multiple sessions)
            const visitorSessionCounts = visitorSessions.reduce((acc, session) => {
                acc[session.visitorId] = (acc[session.visitorId] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const returningVisitors = Object.values(visitorSessionCounts).filter(count => count > 1).length;

            // Calculate session durations
            const sessionDurations = visitorSessions
                .filter(session => session.endedAt)
                .map(session => {
                    const duration = session.endedAt!.getTime() - session.startedAt.getTime();
                    return Math.round(duration / 1000 / 60); // Convert to minutes
                });

            const averageSessionDuration = sessionDurations.length > 0
                ? Math.round(sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length)
                : 0;

            // Calculate conversion rate (visitors who started a chat)
            const visitorsWhoStartedChat = visitorSessions.filter(session => session.chatRoom !== null).length;
            const conversionRate = totalVisitors > 0
                ? Number(((visitorsWhoStartedChat / totalVisitors) * 100).toFixed(1))
                : 0;

            // Calculate engagement metrics
            const totalMessages = visitorSessions.reduce((sum, session) =>
                sum + (session.chatRoom ? session.chatRoom.messages.filter(msg => msg.senderType === 'visitor').length : 0), 0);

            const averageMessagesPerVisitor = totalVisitors > 0
                ? Math.round(totalMessages / totalVisitors)
                : 0;

            return {
                workspaceId,
                timeRange,
                totalVisitors,
                uniqueVisitors,
                returningVisitors,
                averageSessionDuration,
                conversionRate,
                totalMessages,
                averageMessagesPerVisitor,
                period: `${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
            };
        } catch (error) {
            this.logger.error(`Calculate visitor analytics error: ${error.message}`, 'AnalyticsService');
            return {
                workspaceId,
                timeRange,
                totalVisitors: 0,
                uniqueVisitors: 0,
                returningVisitors: 0,
                averageSessionDuration: 0,
                conversionRate: 0,
                totalMessages: 0,
                averageMessagesPerVisitor: 0,
                period: `Error calculating for ${timeRange}`,
            };
        }
    }

    private async generateWorkspaceDailyStats(workspaceId: string, startDate: Date, endDate: Date): Promise<any[]> {
        try {
            const dailyStats: any[] = [];
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const dayStart = new Date(currentDate);
                dayStart.setHours(0, 0, 0, 0);

                const dayEnd = new Date(currentDate);
                dayEnd.setHours(23, 59, 59, 999);

                // Get chats for this day
                const dayChats = await this.prisma.chatRoom.count({
                    where: {
                        workspaceId,
                        createdAt: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                    },
                });

                // Get messages for this day
                const dayMessages = await this.prisma.chatMessage.count({
                    where: {
                        room: {
                            workspaceId,
                        },
                        createdAt: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                    },
                });

                dailyStats.push({
                    date: currentDate.toISOString().split('T')[0],
                    chats: dayChats,
                    messages: dayMessages,
                    responseTime: 180, // Placeholder - could be calculated more precisely
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            return dailyStats;
        } catch (error) {
            this.logger.error(`Generate workspace daily stats error: ${error.message}`, 'AnalyticsService');
            return [];
        }
    }

    private async queueWorkspacePerformanceMetrics(workspaceId: string, timeRange: string, agentMetrics: any[]) {
        try {
            const timestamp = new Date();

            // Calculate workspace-level aggregated metrics
            const totalChats = agentMetrics.reduce((sum, agent) => sum + agent.totalChats, 0);
            const totalMessages = agentMetrics.reduce((sum, agent) => sum + agent.totalMessages, 0);
            const totalResolved = agentMetrics.reduce((sum, agent) => sum + agent.resolvedChats, 0);

            // Calculate average response time across all agents
            const validResponseTimes = agentMetrics.filter(agent => agent.averageResponseTime > 0);
            const avgResponseTime = validResponseTimes.length > 0
                ? Math.round(validResponseTimes.reduce((sum, agent) => sum + agent.averageResponseTime, 0) / validResponseTimes.length)
                : 0;

            // Calculate average satisfaction score across all agents
            const validSatisfactionScores = agentMetrics.filter(agent => agent.satisfactionScore > 0);
            const avgSatisfactionScore = validSatisfactionScores.length > 0
                ? Number((validSatisfactionScores.reduce((sum, agent) => sum + agent.satisfactionScore, 0) / validSatisfactionScores.length).toFixed(1))
                : 0;

            // Calculate resolution rate
            const resolutionRate = totalChats > 0 ? Number(((totalResolved / totalChats) * 100).toFixed(1)) : 0;

            // Queue performance metrics for persistence
            const performanceMetrics = [
                {
                    metricType: 'response_time',
                    metricName: 'average_response_time',
                    value: avgResponseTime,
                    unit: 'seconds',
                },
                {
                    metricType: 'satisfaction',
                    metricName: 'average_satisfaction_score',
                    value: avgSatisfactionScore,
                    unit: 'rating',
                },
                {
                    metricType: 'volume',
                    metricName: 'total_chats',
                    value: totalChats,
                    unit: 'count',
                },
                {
                    metricType: 'volume',
                    metricName: 'total_messages',
                    value: totalMessages,
                    unit: 'count',
                },
                {
                    metricType: 'resolution',
                    metricName: 'resolution_rate',
                    value: resolutionRate,
                    unit: 'percentage',
                },
                {
                    metricType: 'capacity',
                    metricName: 'active_agents',
                    value: agentMetrics.filter(agent => agent.currentStatus === 'online').length,
                    unit: 'count',
                },
            ];

            // Queue each metric as a separate background job
            for (const metric of performanceMetrics) {
                await this.analyticsQueue.add('chat-analytics', {
                    eventType: 'chat_performance_metric_recorded',
                    workspaceId,
                    metricType: metric.metricType,
                    metricName: metric.metricName,
                    value: metric.value,
                    unit: metric.unit,
                    timePeriod: timeRange,
                    timestamp,
                });
            }

            this.logger.log(`Queued ${performanceMetrics.length} workspace performance metrics for ${workspaceId}`, 'AnalyticsService');
        } catch (error) {
            this.logger.error(`Queue workspace performance metrics error: ${error.message}`, 'AnalyticsService');
        }
    }

    private async queueCalculatedWorkspaceMetrics(workspaceId: string, timeRange: string, analytics: any) {
        try {
            const timestamp = new Date();

            // Calculate resolution rate
            const resolutionRate = analytics.totalChats > 0
                ? Number(((analytics.resolvedChats / analytics.totalChats) * 100).toFixed(1))
                : 0;

            // Calculate agent efficiency
            const agentEfficiency = analytics.totalMessages > 0
                ? Number(((analytics.agentMessages / analytics.totalMessages) * 100).toFixed(1))
                : 0;

            // Queue calculated workspace metrics for persistence
            const workspaceMetrics = [
                {
                    metricType: 'response_time',
                    metricName: 'workspace_average_response_time',
                    value: analytics.averageResponseTime,
                    unit: 'milliseconds',
                },
                {
                    metricType: 'satisfaction',
                    metricName: 'workspace_satisfaction_score',
                    value: analytics.satisfactionScore,
                    unit: 'rating',
                },
                {
                    metricType: 'volume',
                    metricName: 'workspace_total_chats',
                    value: analytics.totalChats,
                    unit: 'count',
                },
                {
                    metricType: 'volume',
                    metricName: 'workspace_active_chats',
                    value: analytics.activeChats,
                    unit: 'count',
                },
                {
                    metricType: 'volume',
                    metricName: 'workspace_total_messages',
                    value: analytics.totalMessages,
                    unit: 'count',
                },
                {
                    metricType: 'resolution',
                    metricName: 'workspace_resolution_rate',
                    value: resolutionRate,
                    unit: 'percentage',
                },
                {
                    metricType: 'efficiency',
                    metricName: 'workspace_agent_efficiency',
                    value: agentEfficiency,
                    unit: 'percentage',
                },
                {
                    metricType: 'duration',
                    metricName: 'workspace_average_chat_duration',
                    value: analytics.averageChatDuration,
                    unit: 'seconds',
                },
            ];

            // Queue each metric as a separate background job
            for (const metric of workspaceMetrics) {
                await this.analyticsQueue.add('chat-analytics', {
                    eventType: 'chat_performance_metric_recorded',
                    workspaceId,
                    metricType: metric.metricType,
                    metricName: metric.metricName,
                    value: metric.value,
                    unit: metric.unit,
                    timePeriod: timeRange,
                    timestamp,
                });
            }

            this.logger.log(`Queued ${workspaceMetrics.length} calculated workspace metrics for ${workspaceId}`, 'AnalyticsService');
        } catch (error) {
            this.logger.error(`Queue calculated workspace metrics error: ${error.message}`, 'AnalyticsService');
        }
    }

    onModuleDestroy() {
        if (this.analyticsQueueTimer) {
            clearTimeout(this.analyticsQueueTimer);
            this.analyticsQueueTimer = null;
        }
    }
} 