import { Injectable, Inject, OnModuleDestroy, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { SecureIdService } from '../../common/services/secure-id.service';
import { CreateVisitorSessionDto } from '../dtos';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { VisitorPageChanged } from '../types/chat-types';

@Injectable()
export class VisitorService implements OnModuleDestroy {
    // Redis key constants for consistency and maintainability
    private readonly REDIS_KEYS = {
        // Session management keys
        VISITOR_SESSION: (sessionId: string) => `visitor_session:${sessionId}`,

        // Workspace visitor tracking keys
        WORKSPACE_ACTIVE_VISITORS: (workspaceId: string) => `workspace:${workspaceId}:active_visitors`,

        // Conversation tracking keys
        VISITOR_HAS_CONVERSATION: (visitorId: string, workspaceId: string) => `visitor:${visitorId}:${workspaceId}:has_conversation`,

        // Page tracking keys
        VISITOR_PAGE_TRACKING: (visitorId: string, workspaceId: string) => `visitor_page_tracking:${visitorId}:${workspaceId}`,
    };

    // Redis expiration times (in seconds)
    private readonly REDIS_EXPIRATIONS = {
        VISITOR_SESSION: 86400, // 24 hours
        WORKSPACE_ACTIVE_VISITORS: 86400, // 24 hours
        VISITOR_HAS_CONVERSATION: 300, // 5 minutes
        VISITOR_PAGE_TRACKING: 3600, // 1 hour
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        private readonly workspaceService: WorkspaceService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('CHAT_ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
        private readonly secureIdService: SecureIdService,
    ) { }

    // Circuit breaker for Redis operations
    private redisFailureCount = 0;
    private readonly MAX_REDIS_FAILURES = 5;
    private readonly REDIS_CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
    private redisCircuitBreakerOpen = false;
    private redisCircuitBreakerOpenTime = 0;

    // ============================================================================
    // PUBLIC METHODS FOR CONTROLLER ENDPOINTS
    // ============================================================================

    async createVisitorSession(data: CreateVisitorSessionDto) {
        try {

            // Check if workspace exists
            const workspace = await this.workspaceService.getWorkspaceById(data.workspaceId);

            if (!workspace) {
                throw new Error('Invalid workspace ID. No such workspace exists.');
            }

            // Use SecureIdService for enterprise-grade session ID generation
            const sessionId = this.secureIdService.generateSessionId();

            const sessionData = {
                id: sessionId,
                visitorId: data.visitor_id,
                workspaceId: data.workspaceId,

                // Visitor identity fields
                visitorEmail: data.email,
                visitorName: data.name,
                visitorPhone: data.phone,
                visitorAvatarUrl: data.avatarUrl,
                visitorMetadata: data.metadata,

                // Session context fields
                userAgent: data.userAgent,
                ipAddress: data.ipAddress,
                deviceInfo: data.deviceInfo,
                deviceFingerprint: data.deviceFingerprint,
                hostName: data.hostName,
                browser: data.browser,
                location: data.location,
                referrerData: data.referrerData,

                // Page tracking fields
                pageTracking: data.pageTracking,

                // Session state
                status: data.status || 'ACTIVE',
                startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
                endedAt: data.endedAt ? new Date(data.endedAt) : null,
                lastActivityAt: data.lastActivityAt ? new Date(data.lastActivityAt) : new Date(),
            };

            // 1. CACHE FIRST - Store session data immediately for real-time access
            await this.safeRedisOperation(async () => {
                const sessionKey = this.REDIS_KEYS.VISITOR_SESSION(sessionId);

                const sessionDataToStore = {
                    id: sessionId,
                    visitorId: data.visitor_id,
                    workspaceId: data.workspaceId,

                    // Visitor identity fields
                    visitorEmail: data.email || '',
                    visitorName: data.name || '',
                    visitorPhone: data.phone || '',
                    visitorAvatarUrl: data.avatarUrl || '',
                    visitorMetadata: data.metadata ? JSON.stringify(data.metadata) : '',

                    // Session context fields
                    userAgent: data.userAgent || '',
                    ipAddress: data.ipAddress || '',
                    deviceInfo: data.deviceInfo ? JSON.stringify(data.deviceInfo) : '',
                    deviceFingerprint: data.deviceFingerprint ? JSON.stringify(data.deviceFingerprint) : '',
                    hostName: data.hostName || '',
                    browser: data.browser || '',
                    location: data.location ? JSON.stringify(data.location) : '',
                    referrerData: data.referrerData ? JSON.stringify(data.referrerData) : '',

                    // Page tracking fields
                    pageTracking: data.pageTracking ? JSON.stringify(data.pageTracking) : '',

                    // Session state
                    status: data.status || 'ACTIVE',
                    startedAt: sessionData.startedAt.toISOString(),
                    endedAt: sessionData.endedAt ? sessionData.endedAt.toISOString() : '',
                    lastActivityAt: sessionData.lastActivityAt.toISOString(),
                };

                await this.redis.hset(sessionKey, sessionDataToStore);
                await this.redis.expire(sessionKey, this.REDIS_EXPIRATIONS.VISITOR_SESSION);

                // Update workspace visitor tracking
                const workspaceVisitorsKey = this.REDIS_KEYS.WORKSPACE_ACTIVE_VISITORS(data.workspaceId);
                await this.redis.zadd(workspaceVisitorsKey, Date.now(), data.visitor_id);

                await this.redis.expire(workspaceVisitorsKey, this.REDIS_EXPIRATIONS.WORKSPACE_ACTIVE_VISITORS);

                return { success: true, sessionKey };
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'visitor_session_created',
                sessionData
            });

            // Check for existing conversation from cache first, then DB fallback
            const existingConversation = await this.checkExistingConversation(data.visitor_id, data.workspaceId);

            this.logger.log(`Visitor session created for ${data.visitor_id}`, 'VisitorService');

            return {
                sessionId: sessionId,
                existingConversation: existingConversation,
            };
        } catch (error) {
            this.logger.error(`Create visitor session error: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    async endVisitorSession(sessionId: string) {
        try {
            // Get session data from cache first
            const sessionData = await this.getSessionById(sessionId);
            if (!sessionData) {
                throw new Error('Session not found');
            }

            const duration = Math.floor((Date.now() - new Date(sessionData.startedAt).getTime()) / 1000);

            // 1. CACHE FIRST - Update session status immediately
            await this.safeRedisOperation(async () => {
                const sessionKey = this.REDIS_KEYS.VISITOR_SESSION(sessionId);
                await this.redis.hset(sessionKey, {
                    status: 'AWAY',
                    endedAt: new Date().toISOString(),
                    duration: duration,
                });

                // Remove from active visitors
                const workspaceVisitorsKey = this.REDIS_KEYS.WORKSPACE_ACTIVE_VISITORS(sessionData.workspaceId);
                await this.redis.zrem(workspaceVisitorsKey, sessionData.visitorId);
            });

            // 2. DATABASE UPDATE - Update session status immediately in database
            await this.prisma.visitorSession.update({
                where: {
                    id: sessionId,
                },
                data: {
                    status: 'AWAY',
                    endedAt: new Date(),
                },
            });

            // 3. QUEUE FOR ANALYTICS PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'visitor_session_ended',
                sessionId,
                visitorId: sessionData.visitorId,
                workspaceId: sessionData.workspaceId,
                endedAt: new Date(),
                duration,
            });

            this.logger.log(`Visitor session ended: ${sessionId}`, 'VisitorService');

            return {
                success: true,
                duration,
            };
        } catch (error) {
            this.logger.error(`End visitor session error: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    async getVisitorSessionById(sessionId: string): Promise<any> {
        try {
            const sessionData = await this.getSessionById(sessionId);
            return sessionData;
        } catch (error) {
            this.logger.error(`Get visitor session by ID error: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    async updateSessionStatus(visitorSessionId: string, status: 'ACTIVE' | 'IDLE' | 'AWAY' | 'INCOMING' | 'CURRENTLY_SERVED' | 'PENDING_TRANSFER' | 'PENDING_INVITE') {
        try {
            const now = new Date();

            // Get session data to access visitor ID
            const sessionData = await this.getSessionById(visitorSessionId);
            if (!sessionData) {
                throw new Error('Session not found');
            }

            // Prepare update data
            const updateData: any = {
                status: status,
                lastActivityAt: now,
            };

            // Set endedAt if status is AWAY
            if (status === 'AWAY') {
                updateData.endedAt = now;
            }

            // 2. DATABASE UPDATE - Update status in database
            const updatedSession = await this.prisma.visitorSession.update({
                where: {
                    id: visitorSessionId,
                },
                data: updateData,
            });

            // 3. UPDATE VISITOR ANALYTICS - Update lastVisitAt for analytics using visitor ID
            if (updatedSession) {
                await this.prisma.visitorAnalytics.updateMany({
                    where: {
                        visitorId: sessionData.visitorId,
                        workspaceId: sessionData.workspaceId,
                    },
                    data: {
                        lastVisitAt: now,
                    },
                });
            }

            // 4. INVALIDATE VISITOR SESSION IN CACHE
            await this.safeRedisOperation(async () => {
                const sessionKey = this.REDIS_KEYS.VISITOR_SESSION(visitorSessionId);
                await this.redis.del(sessionKey);
            });

            // 4. LOG THE STATUS CHANGE
            this.logger.log(`Session status updated for ${visitorSessionId} (visitor: ${sessionData.visitorId}) to ${status}`, 'VisitorService');

            return {
                success: true,
                status: status,
                timestamp: now,
                visitorId: sessionData.visitorId,
                message: `Session status updated to ${status}`,
            };
        } catch (error) {
            this.logger.error(`Update session status error for ${visitorSessionId}: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    async getActiveVisitorsInWorkspace(workspaceId: string, departmentId?: string): Promise<{
        active: any[];
        idle: any[];
        incoming: any[];
        currentlyServed: any[];
        pendingTransfer: any[];
        pendingInvite: any[];
    }> {
        try {

            let visitorSessions: any[] = [];

            // Get all visitor sessions in the workspace (excluding AWAY status)
            const activeSessions = await this.prisma.visitorSession.findMany({
                where: {
                    workspaceId,
                    status: {
                        not: 'AWAY',
                    },
                },
                include: {
                    visitor: true,
                    chatRoom: {
                        include: {
                            department: true,
                            departments: true,
                            messages: {
                                where: {
                                    senderType: {
                                        in: ['agent', 'visitor']
                                    }
                                },
                                orderBy: {
                                    createdAt: 'desc',
                                },
                                take: 10,
                            },
                            agentStatuses: {
                                include: {
                                    user: true,
                                }
                            },
                            conversationTags: {
                                where: {
                                    removedAt: null,
                                    removedByUser: null,
                                    removedByVisitor: null,
                                },
                                include: {
                                    tag: true,
                                }
                            }
                        }
                    },
                    visitorPageTracking: true,
                },
                orderBy: {
                    lastActivityAt: 'desc',
                },
            });

            if (activeSessions && activeSessions.length > 0) {
                for (const session of activeSessions) {
                    if (departmentId && session.chatRoom && session.chatRoom.currentServingDepartmentId && session.chatRoom.currentServingDepartmentId === departmentId) {
                        visitorSessions.push(session);
                    } else if (departmentId && session.chatRoom && session.chatRoom.departments && session.chatRoom.departments.some(d => d.id === departmentId)) {
                        visitorSessions.push(session);
                    } else if (!session.chatRoom || !session.chatRoom.currentServingDepartmentId) {
                        visitorSessions.push(session);
                    }
                }
            }

            // Transform sessions into visitor data and group by status
            const groupedVisitors = {
                active: [] as any[],
                idle: [] as any[],
                incoming: [] as any[],
                currentlyServed: [] as any[],
                pendingTransfer: [] as any[],
                pendingInvite: [] as any[],
            };

            for (const session of visitorSessions) {
                const visitorData = {
                    visitorId: session.visitorId,
                    sessionId: session.id,
                    name: session.visitor?.name,
                    email: session.visitor?.email,
                    phone: session.visitor?.phone,
                    isIdentified: session.visitor?.isIdentified || false,
                    totalChats: session.visitor?.totalChats || 0,
                    totalVisits: session.visitor?.sessionCount || 0,
                    lastSeenAt: session.visitor?.lastSeenAt,
                    pageTracking: session.visitorPageTracking,
                    referrerData: session.referrerData,
                    location: session.location,
                    userAgent: session.userAgent,
                    deviceInfo: session.deviceInfo,
                    browser: session.browser,
                    aiStatus: 'TO-BE-IMPLEMENTED',
                    roomId: session.chatRoom?.id,
                    connectedAt: session.startedAt,
                    lastActivityAt: session.lastActivityAt,
                    servingDepartment: session.chatRoom?.department?.name,
                    tags: session.chatRoom?.conversationTags.map((t: any) => ({
                        id: t.tag.id,
                        name: t.tag.name,
                        color: t.tag.color,
                        ...(t.assignedByUser ? { assignedBy: t.assignedByUser } : t.assignedByVisitor ? { assignedBy: "visitor" } : {}),
                    })),
                    messages: session.chatRoom?.messages ? [...session.chatRoom?.messages].reverse().filter((m: any) => !m.deliveredAt).map((m: any) => ({
                        messageId: m.messageId,
                        content: m.content,
                        senderType: m.senderType,
                        senderId: m.senderType === 'agent' ? m.userId : m.sessionId,
                        senderName: m.senderType === 'visitor' ? m.visitorSession?.visitor?.name : m.senderType === 'agent' ? m.user?.name : 'system',
                        createdAt: m.createdAt,
                        readAt: m.readAt,
                        deliveredAt: m.deliveredAt,
                        isInternal: m.isInternal,
                        messageType: m.messageType,
                        metadata: m.metadata,
                    })) : [],
                    lastMessage: null,
                    agentsInRoom: null,
                };

                // Group by status (convert enum to lowercase for grouping)
                const status = session.status.toLowerCase();
                if (status === 'active') {
                    groupedVisitors.active.push(visitorData);
                } else if (status === 'idle') {
                    groupedVisitors.idle.push(visitorData);
                } else if (status === 'incoming') {
                    visitorData.lastMessage = session.chatRoom?.messages[0];
                    groupedVisitors.incoming.push(visitorData);
                } else if (status === 'currently_served') {
                    visitorData.agentsInRoom = session.chatRoom?.agentStatuses.map(a => ({
                        agentId: a.userId,
                        agentName: a.user.name,
                        agentStatus: a.status,
                    }));
                    groupedVisitors.currentlyServed.push(visitorData);
                } else if (status === 'pending_transfer') {
                    visitorData.lastMessage = session.chatRoom?.messages[0];
                    visitorData.agentsInRoom = session.chatRoom?.agentStatuses.map(a => ({
                        agentId: a.userId,
                        agentName: a.user.name,
                        agentStatus: a.status,
                    }));
                    groupedVisitors.pendingTransfer.push(visitorData);
                } else if (status === 'pending_invite') {
                    visitorData.lastMessage = session.chatRoom?.messages[0];
                    visitorData.agentsInRoom = session.chatRoom?.agentStatuses.map(a => ({
                        agentId: a.userId,
                        agentName: a.user.name,
                        agentStatus: a.status,
                    }));
                    groupedVisitors.pendingInvite.push(visitorData);
                }
            }

            if (departmentId) {
                this.logger.log(`Retrieved ${visitorSessions.length} active visitors for department ${departmentId} in workspace ${workspaceId}`, 'VisitorService');
            } else {
                this.logger.log(`Retrieved ${visitorSessions.length} active visitors for workspace ${workspaceId}`, 'VisitorService');
            }

            return groupedVisitors;
        } catch (error) {
            this.logger.error(`Error getting active visitors: ${error.message}`, 'VisitorService');
            return {
                active: [],
                idle: [],
                incoming: [],
                currentlyServed: [],
                pendingTransfer: [],
                pendingInvite: [],
            };
        }
    }

    async getActiveVisitorsForMultipleDepartments(workspaceId: string, departmentIds: string[]): Promise<{
        active: any[];
        idle: any[];
        incoming: any[];
        currentlyServed: any[];
        pendingTransfer: any[];
        pendingInvite: any[];
    }> {
        try {
            // Get all visitor sessions in the workspace (excluding AWAY status)
            const activeSessions = await this.prisma.visitorSession.findMany({
                where: {
                    workspaceId,
                    status: {
                        not: 'AWAY',
                    },
                },
                include: {
                    visitor: true,
                    chatRoom: {
                        include: {
                            department: true,
                            departments: true,
                            messages: {
                                where: {
                                    senderType: {
                                        in: ['agent', 'visitor']
                                    }
                                },
                                orderBy: {
                                    createdAt: 'desc',
                                },
                                take: 10,
                            },
                            agentStatuses: {
                                include: {
                                    user: true,
                                }
                            },
                            conversationTags: {
                                where: {
                                    removedAt: null,
                                    removedByUser: null,
                                    removedByVisitor: null,
                                },
                                include: {
                                    tag: true,
                                }
                            }
                        }
                    },
                    visitorPageTracking: true,
                },
                orderBy: {
                    lastActivityAt: 'desc',
                },
            });

            // Use a Map to deduplicate by visitorId while preserving the most relevant entry
            const visitorMap = new Map<string, any>();

            for (const session of activeSessions) {
                const visitorId = session.visitorId;
                const sessionDepartmentId = session.chatRoom?.currentServingDepartmentId;

                // Check if this session belongs to any of the requested departments
                // Check currentServingDepartmentId first, then check departments array
                let isInRequestedDepartment = false;

                for (const departmentId of departmentIds) {
                    if (sessionDepartmentId === departmentId) {
                        isInRequestedDepartment = true;
                        break;
                    } else if (session.chatRoom?.departments && session.chatRoom.departments.some(d => d.id === departmentId)) {
                        isInRequestedDepartment = true;
                        break;
                    }
                }

                // Also include sessions without any department assignment
                if (!session.chatRoom || !session.chatRoom.currentServingDepartmentId) {
                    isInRequestedDepartment = true;
                }

                if (isInRequestedDepartment) {
                    const existing = visitorMap.get(visitorId);

                    if (!existing) {
                        // First occurrence of this visitor
                        visitorMap.set(visitorId, session);
                    } else {
                        // Priority logic: prefer the one with more recent activity or higher priority status
                        const existingPriority = this.getSessionPriority(existing);
                        const currentPriority = this.getSessionPriority(session);

                        if (currentPriority > existingPriority) {
                            visitorMap.set(visitorId, session);
                        }
                    }
                }
            }

            // Transform sessions into visitor data and group by status
            const groupedVisitors = {
                active: [] as any[],
                idle: [] as any[],
                incoming: [] as any[],
                currentlyServed: [] as any[],
                pendingTransfer: [] as any[],
                pendingInvite: [] as any[],
            };

            for (const session of visitorMap.values()) {
                const visitorData = {
                    visitorId: session.visitorId,
                    sessionId: session.id,
                    name: session.visitor?.name,
                    email: session.visitor?.email,
                    phone: session.visitor?.phone,
                    isIdentified: session.visitor?.isIdentified || false,
                    totalChats: session.visitor?.totalChats || 0,
                    totalVisits: session.visitor?.sessionCount || 0,
                    lastSeenAt: session.visitor?.lastSeenAt,
                    pageTracking: session.visitorPageTracking,
                    referrerData: session.referrerData,
                    location: session.location,
                    userAgent: session.userAgent,
                    deviceInfo: session.deviceInfo,
                    browser: session.browser,
                    aiStatus: 'TO-BE-IMPLEMENTED',
                    roomId: session.chatRoom?.id,
                    connectedAt: session.startedAt,
                    lastActivityAt: session.lastActivityAt,
                    servingDepartment: session.chatRoom?.department?.name,
                    tags: session.chatRoom?.conversationTags.map((t: any) => ({
                        id: t.tag.id,
                        name: t.tag.name,
                        color: t.tag.color,
                        ...(t.assignedByUser ? { assignedBy: t.assignedByUser } : t.assignedByVisitor ? { assignedBy: "visitor" } : {}),
                    })),
                    messages: session.chatRoom?.messages ? [...session.chatRoom?.messages].reverse().filter((m: any) => !m.deliveredAt).map((m: any) => ({
                        messageId: m.messageId,
                        content: m.content,
                        senderType: m.senderType,
                        senderId: m.senderType === 'agent' ? m.userId : m.sessionId,
                        senderName: m.senderType === 'visitor' ? m.visitorSession?.visitor?.name : m.senderType === 'agent' ? m.user?.name : 'system',
                        createdAt: m.createdAt,
                        readAt: m.readAt,
                        deliveredAt: m.deliveredAt,
                        isInternal: m.isInternal,
                        messageType: m.messageType,
                        metadata: m.metadata,
                    })) : [],
                    lastMessage: null,
                    agentsInRoom: null,
                };

                // Group by status (convert enum to lowercase for grouping)
                const status = session.status.toLowerCase();
                if (status === 'active') {
                    groupedVisitors.active.push(visitorData);
                } else if (status === 'idle') {
                    groupedVisitors.idle.push(visitorData);
                } else if (status === 'incoming') {
                    visitorData.lastMessage = session.chatRoom?.messages[0];
                    groupedVisitors.incoming.push(visitorData);
                } else if (status === 'currently_served') {
                    visitorData.agentsInRoom = session.chatRoom?.agentStatuses.map(a => ({
                        agentId: a.userId,
                        agentName: a.user.name,
                        agentStatus: a.status,
                    }));
                    groupedVisitors.currentlyServed.push(visitorData);
                } else if (status === 'pending_transfer') {
                    visitorData.lastMessage = session.chatRoom?.messages[0];
                    visitorData.agentsInRoom = session.chatRoom?.agentStatuses.map(a => ({
                        agentId: a.userId,
                        agentName: a.user.name,
                        agentStatus: a.status,
                    }));
                    groupedVisitors.pendingTransfer.push(visitorData);
                } else if (status === 'pending_invite') {
                    visitorData.lastMessage = session.chatRoom?.messages[0];
                    visitorData.agentsInRoom = session.chatRoom?.agentStatuses.map(a => ({
                        agentId: a.userId,
                        agentName: a.user.name,
                        agentStatus: a.status,
                    }));
                    groupedVisitors.pendingInvite.push(visitorData);
                }
            }

            this.logger.log(`Retrieved ${visitorMap.size} unique active visitors for ${departmentIds.length} departments in workspace ${workspaceId}`, 'VisitorService');

            return groupedVisitors;
        } catch (error) {
            this.logger.error(`Error getting active visitors for multiple departments: ${error.message}`, 'VisitorService');
            return {
                active: [],
                idle: [],
                incoming: [],
                currentlyServed: [],
                pendingTransfer: [],
                pendingInvite: [],
            };
        }
    }

    private getSessionPriority(session: any): number {
        // Priority order: currently_served > pending_transfer > pending_invite > active > incoming > idle
        const status = session.status.toLowerCase();
        if (status === 'currently_served') return 6;
        if (status === 'pending_transfer') return 5;
        if (status === 'pending_invite') return 4;
        if (status === 'active') return 3;
        if (status === 'incoming') return 2;
        if (status === 'idle') return 1;
        return 0;
    }

    async validateVisitorSession(sessionId: string, visitorId: string, workspaceId: string): Promise<boolean> {
        try {
            // First, check Redis cache (where sessions are stored immediately)
            const cachedSession = await this.safeRedisOperation(async () => {
                const sessionKey = this.REDIS_KEYS.VISITOR_SESSION(sessionId);
                const sessionData = await this.redis.hgetall(sessionKey);
                return Object.keys(sessionData).length > 0 ? sessionData : null;
            });

            if (cachedSession) {
                // Check if session is active and matches the sessionId
                const idMatch = cachedSession.id === sessionId;

                if (idMatch) {
                    return true;
                }
            }

            // Fallback to database check using session ID
            const session = await this.prisma.visitorSession.findFirst({
                where: {
                    id: sessionId,
                    visitorId: visitorId,
                    workspaceId: workspaceId,
                },
            });

            if (!session) {
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(`Validate visitor session error: ${error.message}`, 'VisitorService');
            return false;
        }
    }

    async trackVisitorPage(
        visitorSessionId: string,
        visitorId: string,
        workspaceId: string,
        data: VisitorPageChanged
    ) {
        try {
            const existingTracking = await this.prisma.visitorPageTracking.findUnique({
                where: { sessionId: visitorSessionId },
            });

            if (existingTracking && existingTracking.pageUrl === data.pageUrl
                && existingTracking.pageHash === data.pageHash
                && existingTracking.pageQuery === data.pageQuery
                && existingTracking.pagePath === data.pagePath
            ) {
                return;
            }

            const now = new Date();

            // Upsert visitor page tracking by session
            const updatedPageTracking = await this.prisma.visitorPageTracking.upsert({
                where: { sessionId: visitorSessionId },
                update: {
                    // Current page details
                    pageUrl: data.pageUrl,
                    pageTitle: data.pageTitle,
                    pagePath: data.pagePath,
                    pageHash: data.pageHash,
                    pageQuery: data.pageQuery,

                    // Metrics and navigation context
                    timeOnPage: data.timeOnPage,
                    pageLoadTime: data.pageLoadTime,
                    navigationMethod: data.navigationMethod,
                    navigationSource: data.navigationSource,
                    navigationIntent: data.navigationIntent,

                    // Timing
                    viewedAt: now,

                    // Append new page entry into navigation path
                    navigationPath: {
                        push: {
                            pageUrl: data.pageUrl,
                            pageTitle: data.pageTitle,
                            pagePath: data.pagePath,
                            pageHash: data.pageHash,
                            pageQuery: data.pageQuery,
                            timeOnPage: data.timeOnPage,
                            pageLoadTime: data.pageLoadTime,
                            navigationMethod: data.navigationMethod,
                            navigationSource: data.navigationSource,
                            navigationIntent: data.navigationIntent,
                            viewedAt: now,
                            timestamp: now,
                        },
                    },
                },
                create: {
                    // Keys
                    visitorId,
                    sessionId: visitorSessionId,
                    workspaceId,

                    // First page details
                    pageUrl: data.pageUrl,
                    pageTitle: data.pageTitle,
                    pagePath: data.pagePath,
                    pageHash: data.pageHash,
                    pageQuery: data.pageQuery,

                    // Metrics and navigation context
                    timeOnPage: data.timeOnPage,
                    pageLoadTime: data.pageLoadTime,
                    navigationMethod: data.navigationMethod,
                    navigationSource: data.navigationSource,
                    navigationIntent: data.navigationIntent,

                    // Timing
                    viewedAt: now,

                    // Initialize navigation path with first entry
                    navigationPath: [
                        {
                            pageUrl: data.pageUrl,
                            pageTitle: data.pageTitle,
                            pagePath: data.pagePath,
                            pageHash: data.pageHash,
                            pageQuery: data.pageQuery,
                            timeOnPage: data.timeOnPage,
                            pageLoadTime: data.pageLoadTime,
                            navigationMethod: data.navigationMethod,
                            navigationSource: data.navigationSource,
                            navigationIntent: data.navigationIntent,
                            viewedAt: now,
                            timestamp: now,
                        },
                    ],
                },
            });

            // Refresh cache copy for fast lookups
            const pageTrackingKey = this.REDIS_KEYS.VISITOR_PAGE_TRACKING(visitorId, workspaceId);
            await this.safeRedisOperation(async () => {
                await this.redis.setex(
                    pageTrackingKey,
                    this.REDIS_EXPIRATIONS.VISITOR_PAGE_TRACKING,
                    JSON.stringify({
                        visitorId,
                        workspaceId,
                        navigationPath: updatedPageTracking.navigationPath || [],
                        lastUpdated: now,
                    }),
                );
            });

            this.logger.log(
                `Visitor page tracking updated for session ${visitorSessionId} (visitor ${visitorId})`,
                'VisitorService',
            );

            return {
                success: true,
                pageTracking: updatedPageTracking,
                currentPage: {
                    pageUrl: data.pageUrl,
                    pageTitle: data.pageTitle,
                    pagePath: data.pagePath,
                    pageHash: data.pageHash,
                    pageQuery: data.pageQuery,
                    navigationMethod: data.navigationMethod,
                    navigationSource: data.navigationSource,
                    navigationIntent: data.navigationIntent,
                    viewedAt: now,
                    pageLoadTime: data.pageLoadTime,
                    timeOnPage: data.timeOnPage,
                },
            };
        } catch (error) {
            this.logger.error(`Track visitor page error: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    async visitorIdentify(visitorId: string, workspaceId: string, name?: string, email?: string, phone?: string, notes?: string) {
        try {
            const visitor = await this.prisma.visitor.findUnique({
                where: {
                    id: visitorId,
                    workspaceId: workspaceId,
                },
            });

            if (!visitor) {
                this.logger.error(`Visitor not found: ${visitorId}`, 'VisitorService');
                throw new NotFoundException('Visitor not found');
            }

            const updatedVisitor = await this.prisma.visitor.update({
                where: {
                    id: visitorId,
                    workspaceId: workspaceId,
                },
                data: {
                    name: name,
                    email: email,
                    phone: phone,
                    notes: notes,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    notes: true,
                }
            });

            this.logger.log(`Visitor identity updated: ${visitorId}`, 'VisitorService');
            return updatedVisitor;
        } catch (error) {
            this.logger.error(`Visitor identity update error: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    async visitorPostChatForm(visitorId: string, workspaceId: string, rating?: number, feedback?: string) {
        try {

            const visitor = await this.prisma.visitor.findUnique({
                where: {
                    id: visitorId,
                    workspaceId: workspaceId,
                },
            });

            if (!visitor) {
                this.logger.error(`Visitor not found: ${visitorId}`, 'VisitorService');
                throw new NotFoundException('Visitor not found');
            }

            const updatedVisitor = await this.prisma.visitor.update({
                where: {
                    id: visitorId,
                    workspaceId: workspaceId,
                },
                data: {
                    rating: rating,
                    feedback: feedback,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    notes: true,
                    rating: true,
                    feedback: true,
                }
            });

            this.logger.log(`Visitor post chat form updated: ${visitorId}`, 'VisitorService');
            return updatedVisitor;

        } catch (error) {
            this.logger.error(`Visitor post chat form error: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    async visitorChatStarted(visitorId: string, sessionId: string, roomId: string, workspaceId: string) {
        try {

            const chatRoom = await this.prisma.chatRoom.findUnique({
                where: {
                    id: roomId,
                    workspaceId: workspaceId,
                    visitorSessionId: sessionId,
                },
            });

            if (!chatRoom) {
                this.logger.error(`Chat room not found: ${roomId}`, 'VisitorService');
                throw new NotFoundException('Chat room not found');
            }

            if (chatRoom.startedAt) {
                this.logger.log(`Chat room already started: ${roomId}`, 'VisitorService');
                return;
            }

            await this.prisma.chatRoom.update({
                where: {
                    id: roomId,
                    visitorSessionId: sessionId,
                    workspaceId: workspaceId,
                },
                data: {
                    startedAt: new Date(),
                }
            });

            await this.prisma.visitor.update({
                where: {
                    id: visitorId,
                    workspaceId: workspaceId,
                },
                data: {
                    totalChats: {
                        increment: 1,
                    }
                }
            });

            this.logger.log(`Visitor chat started: ${visitorId} in room: ${roomId}`, 'VisitorService');

        } catch (error) {
            this.logger.error(`Visitor chat started error: ${error.message}`, 'VisitorService');
            throw error;
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

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
                this.logger.log(`Redis circuit breaker reset`, 'VisitorService');
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
                this.logger.error(`Redis circuit breaker opened after ${this.redisFailureCount} failures`, 'VisitorService');
            }
            this.logger.error(`Redis operation failed: ${error.message}`, 'VisitorService');
            return null;
        }
    }

    private async checkExistingConversation(visitorId: string, workspaceId: string): Promise<boolean> {
        try {
            // Try cache first
            const cacheKey = this.REDIS_KEYS.VISITOR_HAS_CONVERSATION(visitorId, workspaceId);
            const cached = await this.safeRedisOperation(async () => {
                return await this.redis.get(cacheKey);
            });

            if (cached !== null) {
                return cached === 'true';
            }

            // Check database
            const existingRoom = await this.prisma.chatRoom.findFirst({
                where: {
                    visitorId,
                    workspaceId
                },
            });

            const hasConversation = !!existingRoom;

            // Cache result for 5 minutes
            await this.safeRedisOperation(async () => {
                await this.redis.setex(cacheKey, this.REDIS_EXPIRATIONS.VISITOR_HAS_CONVERSATION, hasConversation.toString());
            });

            return hasConversation;
        } catch (error) {
            this.logger.error(`Check existing conversation error: ${error.message}`, 'VisitorService');
            return false;
        }
    }

    private async getSessionById(sessionId: string): Promise<any> {
        try {
            // Try cache first
            const cached = await this.safeRedisOperation(async () => {
                const cacheKey = this.REDIS_KEYS.VISITOR_SESSION(sessionId);
                const cachedData = await this.redis.get(cacheKey);
                return cachedData ? JSON.parse(cachedData) : null;
            });

            if (cached) {
                return cached;
            }

            // Get from database using session ID
            const session = await this.prisma.visitorSession.findUnique({
                where: {
                    id: sessionId,
                },
                include: {
                    visitor: true,
                    chatRoom: true,
                },
            });

            if (session) {
                // Cache the result
                await this.safeRedisOperation(async () => {
                    const cacheKey = this.REDIS_KEYS.VISITOR_SESSION(sessionId);
                    await this.redis.setex(cacheKey, this.REDIS_EXPIRATIONS.VISITOR_SESSION, JSON.stringify(session));
                });
            }

            return session;
        } catch (error) {
            this.logger.error(`Get session by ID error: ${error.message}`, 'VisitorService');
            return null;
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    onModuleDestroy() {
        // Clean shutdown - no timers to clear anymore since we use BullMQ
        this.logger.log('VisitorService shutting down', 'VisitorService');
    }
}