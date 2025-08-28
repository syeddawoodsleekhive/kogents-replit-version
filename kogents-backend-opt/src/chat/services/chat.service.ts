import { Injectable, Inject, OnModuleDestroy, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { SecureIdService } from '../../common/services/secure-id.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService implements OnModuleDestroy {
    // Redis key constants for consistency and maintainability
    private readonly REDIS_KEYS = {
        // Room management keys - SINGLE SOURCE OF TRUTH
        ROOM_DATA: (roomId: string) => `room:${roomId}:data`, // Complete room object as JSON
        ROOM_PARTICIPANTS: (roomId: string) => `room:${roomId}:participants`, // Set of participant IDs
        ROOM_MESSAGES: (roomId: string) => `room:${roomId}:messages`, // List of recent messages
        ROOM_DEPARTMENTS: (roomId: string) => `room:${roomId}:departments`, // Set of department IDs
        ROOM_CURRENT_DEPARTMENT: (roomId: string) => `room:${roomId}:current_department`, // Current serving department
        ROOM_HISTORY: (roomId: string, limit: number, offset: number, includeInternal: boolean) =>
            `room:${roomId}:history:${limit}:${offset}:${includeInternal}`,

        // Workspace room management keys
        WORKSPACE_ROOMS: (workspaceId: string) => `workspace:${workspaceId}:rooms`,
        WORKSPACE_CHAT_ROOMS: (workspaceId: string, status: string, limit: number, offset: number) =>
            `workspace:${workspaceId}:rooms:${status || 'all'}:${limit}:${offset}`,

        // Visitor chat management keys
        VISITOR_ACTIVE_CHATS: (visitorId: string, workspaceId: string) =>
            `visitor:${visitorId}:${workspaceId}:active_chats`,
        VISITOR_ACTIVE_ROOMS: (visitorId: string, workspaceId: string) =>
            `visitor:${visitorId}:${workspaceId}:active_rooms`,
        VISITOR_INACTIVE_ROOMS: (workspaceId: string) =>
            `visitor:${workspaceId}:inactive_rooms`,

        // Agent room management keys
        AGENT_ACTIVE_ROOMS: (agentId: string, workspaceId: string) =>
            `agent:${agentId}:${workspaceId}:active_rooms`,

        // Message management keys
        MESSAGE_DELIVERY: (messageId: string) => `message:${messageId}:delivery`,
        MESSAGE_READ: (messageId: string) => `message:${messageId}:read`,
        MESSAGE_ROOM: (messageId: string) => `message:${messageId}:room`,

        // Room read status keys
        ROOM_READ_STATUS: (roomId: string, userId: string) => `room:${roomId}:read:${userId}`,
        ROOM_UNREAD_COUNT: (roomId: string, userId: string) => `room:${roomId}:unread_count:${userId}`,
        ROOM_UNREAD_MESSAGES: (roomId: string, userId: string) => `room:${roomId}:unread:${userId}`,

        // Typing status keys
        TYPING_STATUS: (roomId: string, participantId: string) => `typing:${roomId}:${participantId}`,
        TYPING_PATTERN: (roomId: string) => `typing:${roomId}:*`,
    };

    // Redis expiration times (in seconds)
    private readonly REDIS_EXPIRATIONS = {
        ROOM_DATA: 86400, // 24 hours - single source of truth for room data
        ROOM_PARTICIPANTS: 86400, // 24 hours
        ROOM_MESSAGES: 86400, // 24 hours
        ROOM_HISTORY: 300, // 5 minutes
        WORKSPACE_ROOMS: 86400, // 24 hours
        WORKSPACE_CHAT_ROOMS: 120, // 2 minutes
        VISITOR_ACTIVE_CHATS: 300, // 5 minutes
        VISITOR_ACTIVE_ROOMS: 1800, // 30 minutes
        VISITOR_INACTIVE_ROOMS: 1800, // 30 minutes
        AGENT_ACTIVE_ROOMS: 1800, // 30 minutes
        MESSAGE_DELIVERY: 86400, // 24 hours
        MESSAGE_READ: 86400, // 24 hours
        MESSAGE_ROOM: 3600, // 1 hour
        ROOM_READ_STATUS: 86400, // 24 hours
        ROOM_UNREAD_COUNT: 60, // 1 minute
        ROOM_UNREAD_MESSAGES: 120, // 2 minutes
        TYPING_STATUS: 300, // 5 minutes
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('CHAT_ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
        @Inject('CHAT_NOTIFICATIONS_QUEUE') private readonly notificationsQueue: Queue,
        private readonly secureIdService: SecureIdService,
    ) { }

    // Circuit breaker for Redis operations
    private redisFailureCount = 0;
    private readonly MAX_REDIS_FAILURES = 5;
    private readonly REDIS_CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
    private redisCircuitBreakerOpen = false;
    private redisCircuitBreakerOpenTime = 0;

    async createChatRoom(
        visitorId: string,
        workspaceId: string,
        visitorSessionId: string,
        currentServingDepartmentId?: string,
    ) {
        try {

            // Check if room for visitor session exists
            const existingRoom = await this.prisma.chatRoom.findFirst({
                where: {
                    visitorSessionId,
                    visitorId,
                    workspaceId,
                },
                include: {
                    messages: {
                        where: {
                            isInternal: false,
                            senderType: {
                                in: ['agent-system', 'visitor', 'agent', 'triggered-message']
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        include: {
                            visitorSession: {
                                include: {
                                    visitor: {
                                        select: {
                                            name: true,
                                        }
                                    }
                                }
                            },
                            user: {
                                select: {
                                    name: true,
                                }
                            }
                        },
                        take: 10,
                    },
                    visitor: true
                }
            });

            if (existingRoom) {
                this.logger.warn(`Chat room already exists for visitor session ${visitorSessionId} in workspace ${workspaceId}`, 'ChatService');
                return existingRoom;
            }

            // Check if the visitor has another active session
            const otherActiveSessions = await this.prisma.chatRoom.findMany({
                where: {
                    visitorId,
                    visitorSessionId: {
                        not: visitorSessionId
                    },
                    visitorSession: {
                        status: 'ACTIVE'
                    }
                }
            })

            if (otherActiveSessions.length > 0) {
                // Update the other sessions to AWAY
                for (const session of otherActiveSessions) {
                    await this.prisma.visitorSession.update({
                        where: { id: session.visitorSessionId },
                        data: { status: 'AWAY' }
                    });
                }
            }

            // Generate proper UUID for room
            const roomId = this.secureIdService.generateSecureUuid();

            // Create room data without status and priority (removed from schema)
            const roomData = {
                id: roomId,
                workspaceId,
                visitorId,
                visitorSessionId,
                currentServingDepartmentId,
                messages: null,
                createdAt: new Date(),
                lastActivityAt: new Date(),
                visitor: null,
            };

            // 1. CACHE FIRST - Store room data immediately for real-time access
            await this.safeRedisOperation(async () => {
                const roomKey = this.REDIS_KEYS.ROOM_DATA(roomId);
                await this.redis.setex(roomKey, this.REDIS_EXPIRATIONS.ROOM_DATA, JSON.stringify(roomData));

                // Add room to workspace active rooms
                const workspaceRoomsKey = this.REDIS_KEYS.WORKSPACE_ROOMS(workspaceId);
                await this.redis.zadd(workspaceRoomsKey, Date.now(), roomId);
                await this.redis.expire(workspaceRoomsKey, this.REDIS_EXPIRATIONS.WORKSPACE_ROOMS);

                // Add visitor as participant immediately
                const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);
                await this.redis.sadd(participantsKey, `visitor:${visitorId}`);
                await this.redis.expire(participantsKey, this.REDIS_EXPIRATIONS.ROOM_PARTICIPANTS);
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'room_created',
                roomData,
                participantData: {
                    roomId,
                    visitorId,
                    name: null,
                    role: 'visitor',
                    status: 'ACTIVE', // Use enum value
                    joinedAt: new Date(),
                }
            });

            // 3. QUEUE NOTIFICATIONS (background)
            await this.queueNewChatNotification(roomData);

            this.logger.log(`Chat room ${roomId} created and cached for visitor ${visitorId} with session ${visitorSessionId}`, 'ChatService');

            return roomData;
        } catch (error) {
            this.logger.error(`Create chat room error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async createMessage(
        messageId: string,
        roomId: string,
        senderType: 'visitor' | 'agent' | 'visitor-system' | 'agent-system' | 'triggered-message',
        content: string,
        isInternal: boolean = false,
        sessionId?: string,
        userId?: string,
        workspaceId?: string,
        metadata?: any,
    ) {
        try {
            // Create message data
            const messageData = {
                id: messageId,
                roomId,
                sessionId,
                userId,
                senderType,
                content,
                isInternal,
                messageType: 'text',
                createdAt: new Date(),
                metadata,
            };

            // 1. CACHE FIRST - Store message immediately for real-time access
            await this.safeRedisOperation(async () => {
                // Add to room's message stream
                const messagesKey = this.REDIS_KEYS.ROOM_MESSAGES(roomId);
                await this.redis.lpush(messagesKey, JSON.stringify({
                    id: messageId,
                    visitorId: sessionId,
                    userId,
                    senderType,
                    content,
                    isInternal,
                    createdAt: messageData.createdAt.toISOString(),
                    metadata: messageData.metadata,
                }));

                // Keep only last 100 messages in cache
                await this.redis.ltrim(messagesKey, 0, 99);
                await this.redis.expire(messagesKey, this.REDIS_EXPIRATIONS.ROOM_MESSAGES);

                // Invalidate room data cache to force refresh with new message
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));

                // Update workspace room score for sorting
                if (workspaceId) {
                    const workspaceKey = this.REDIS_KEYS.WORKSPACE_ROOMS(workspaceId);
                    await this.redis.zadd(workspaceKey, Date.now(), roomId);
                }
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE AND ANALYTICS (background)
            const analyticsData: any = {
                eventType: 'message_created',
                messageData,
                roomActivityUpdate: {
                    roomId,
                    lastActivityAt: messageData.createdAt,
                },
                analytics: {
                    visitorId: sessionId,
                    userId,
                    senderType,
                    isInternal,
                    messageLength: content.length,
                }
            };

            // Add response time calculations for agent messages
            if (senderType === 'agent' && !isInternal) {
                analyticsData.responseTimeCalculations = {
                    firstResponseTime: {
                        roomId,
                        messageId,
                        timestamp: messageData.createdAt,
                        agentId: userId,
                    },
                    averageResponseTime: {
                        roomId,
                        messageId,
                        timestamp: messageData.createdAt,
                        agentId: userId,
                    }
                };
            }

            await this.analyticsQueue.add('chat-analytics', analyticsData, {
                priority: 3,
                delay: 0,
            });

            // Queue message_sent analytics event
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'message_sent',
                roomId,
                data: {
                    messageId,
                    visitorId: sessionId,
                    userId,
                    senderType,
                    isInternal,
                    content,
                    createdAt: messageData.createdAt,
                }
            }, {
                priority: 4,
                delay: 0,
            });

            this.logger.log(`Message ${messageId} created and cached for room ${roomId}`, 'ChatService');
            return messageData;
        } catch (error) {
            this.logger.error(`Create message error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async createFileMessage(
        messageId: string,
        roomId: string,
        senderType: 'visitor' | 'agent',
        attachment: {
            url: string;
            fileName: string;
            mimeType: string;
            size: number;
            previewUrl?: string;
            width?: number;
            height?: number;
        },
        caption: string = '',
        isInternal: boolean = false,
        sessionId?: string,
        userId?: string,
        workspaceId?: string,
    ) {
        try {
            const createdAt = new Date();

            const messageData = {
                id: messageId,
                roomId,
                sessionId,
                userId,
                senderType,
                content: caption,
                isInternal,
                messageType: 'file',
                metadata: {
                    attachment,
                },
                createdAt,
            };

            await this.safeRedisOperation(async () => {
                const messagesKey = this.REDIS_KEYS.ROOM_MESSAGES(roomId);
                await this.redis.lpush(messagesKey, JSON.stringify({
                    id: messageId,
                    visitorId: sessionId,
                    userId,
                    senderType,
                    content: messageData.content,
                    isInternal,
                    messageType: 'file',
                    metadata: { attachment },
                    createdAt: createdAt.toISOString(),
                }));

                await this.redis.ltrim(messagesKey, 0, 99);
                await this.redis.expire(messagesKey, this.REDIS_EXPIRATIONS.ROOM_MESSAGES);

                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));

                if (workspaceId) {
                    const workspaceKey = this.REDIS_KEYS.WORKSPACE_ROOMS(workspaceId);
                    await this.redis.zadd(workspaceKey, Date.now(), roomId);
                }
            });

            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'message_created',
                messageData,
                roomActivityUpdate: {
                    roomId,
                    lastActivityAt: createdAt,
                },
                analytics: {
                    visitorId: sessionId,
                    userId,
                    senderType,
                    isInternal,
                    messageType: 'file',
                    fileSize: attachment.size,
                    mimeType: attachment.mimeType,
                },
            }, { priority: 3 });

            this.logger.log(`File message ${messageId} created for room ${roomId}`, 'ChatService');
            return messageData;
        } catch (error) {
            this.logger.error(`Create file message error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async getRoomById(roomId: string, workspaceId: string) {
        try {
            // If not in cache, fetch from database
            const room = await this.prisma.chatRoom.findFirst({
                where: {
                    id: roomId,
                    workspaceId,
                },
                include: {
                    department: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    visitor: true,
                    visitorSession: {
                        include: {
                            visitorPageTracking: true
                        }
                    },
                    primaryAgent: true,
                    participants: {
                        where: {
                            userId: {
                                not: null
                            }
                        },
                        include: {
                            user: {
                                include: {
                                    userDepartments: {
                                        include: {
                                            department: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        include: {
                            user: {
                                select: {
                                    name: true
                                }
                            },
                            visitorSession: {
                                include: {
                                    visitor: {
                                        select: {
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                    analytics: true,
                    conversationTags: {
                        where: {
                            removedAt: null,
                            removedByUser: null,
                            removedByVisitor: null,
                        },
                        include: {
                            tag: true,
                        }
                    },
                    _count: {
                        select: {
                            messages: true,
                            participants: true,
                        },
                    },
                },
            });

            if (!room) {
                this.logger.warn(`Room ${roomId} not found in workspace ${workspaceId}`, 'ChatService');
                return null;
            }

            // Transform the data to match expected format
            const transformedRoom = {
                id: room.id,
                workspaceId: room.workspaceId,
                visitorId: room.visitorId,
                visitorSessionId: room.visitorSessionId,
                createdAt: room.createdAt,
                lastActivityAt: room.lastActivityAt,
                visitorSessionDetails: room.visitorSession,
                primaryAgent: room.primaryAgent,
                department: room.department,
                messages: room.messages.map(m => ({
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
                })),
                analytics: room.analytics ? {
                    totalTurns: room.analytics.messageCount,
                    userTurns: room.analytics.agentMessageCount,
                    visitorTurns: room.analytics.visitorMessageCount,
                    aiAgentTurns: 0,
                    duration: room.analytics.chatDuration,
                    visitorEngagementPercentage: room.analytics.visitorMessageCount / room.analytics.messageCount * 100,
                    agentEngagementPercentage: room.analytics.agentMessageCount / room.analytics.messageCount * 100,
                } : null,
                messageCount: room._count.messages,
                participantCount: room._count.participants,
                visitorDetails: {
                    name: room.visitor?.name,
                    email: room.visitor?.email,
                    phone: room.visitor?.phone,
                },
                agentsDetails: room.participants.map(p => ({
                    id: p.id,
                    name: p.user?.name,
                    email: p.user?.email,
                    phone: p.user?.phone,
                    avatarUrl: p.user?.avatarUrl,
                    departments: p.user?.userDepartments.map(d => { return { id: d.department.id, name: d.department.name } }),
                })),
                tags: room.conversationTags.map((t: any) => ({
                    id: t.tag.id,
                    name: t.tag.name,
                    color: t.tag.color,
                    ...(t.assignedByUser ? { assignedBy: t.assignedByUser } : t.assignedByVisitor ? { assignedBy: "visitor" } : {}),
                })),
                // Add computed fields
                isActive: room.visitorSession?.status !== 'AWAY',
                totalChats: room.visitor?.totalChats || 0,
                totalSessions: room.visitor?.sessionCount || 0,
                hasAgent: room.primaryAgent?.id && room.primaryAgent?.status === 'ACTIVE',
            };

            this.logger.log(`Room ${roomId} retrieved for workspace ${workspaceId}`, 'ChatService');
            return transformedRoom;

        } catch (error) {
            this.logger.error(`Get room by ID error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async updateChatWindowStatus(
        agentId: string,
        roomId: string,
        status: 'OPEN' | 'CLOSED' | 'MINIMIZED' | 'IN_BACKGROUND',
        roomInFocus?: string,
    ) {
        try {
            const affectedOtherRoomIds = await this.prisma.$transaction(async (tx) => {
                // 1) Update the target room status
                await tx.chatRoom.update({
                    where: { id: roomId },
                    data: { chatWindowStatus: status },
                });

                if (status === 'OPEN') {
                    // 2) Find other rooms for this agent that are currently OPEN
                    const otherOpenRooms = await tx.chatRoom.findMany({
                        where: {
                            id: { not: roomId },
                            chatWindowStatus: 'OPEN',
                            participants: {
                                some: { userId: agentId },
                            },
                        },
                        select: { id: true },
                    });

                    // 3) Set those rooms to IN_BACKGROUND
                    if (otherOpenRooms.length > 0) {
                        await tx.chatRoom.updateMany({
                            where: { id: { in: otherOpenRooms.map((r) => r.id) } },
                            data: { chatWindowStatus: 'IN_BACKGROUND' },
                        });
                    }

                    return otherOpenRooms.map((r) => r.id);
                } else if ((status === 'CLOSED' || status === 'MINIMIZED') && roomInFocus) {
                    // 2) Set the room in focus to OPEN
                    await tx.chatRoom.update({
                        where: { id: roomInFocus },
                        data: { chatWindowStatus: 'OPEN' },
                    });

                    return [roomInFocus];
                } else {
                    return [];
                }
            });

            // 4) Invalidate room caches
            await this.safeRedisOperation(async () => {
                // current room
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
                // other affected rooms
                for (const otherId of affectedOtherRoomIds) {
                    await this.redis.del(this.REDIS_KEYS.ROOM_DATA(otherId));
                }
            });

            this.logger.log(
                `Chat window status updated: room ${roomId} -> ${status}; ${affectedOtherRoomIds.length} other room(s) set to IN_BACKGROUND for agent ${agentId}`,
                'ChatService',
            );

            return {
                success: true,
                roomId,
                status,
                updatedOthers: affectedOtherRoomIds,
            };
        } catch (error) {
            this.logger.error(`Update chat window status error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async addAgentToRoom(roomId: string, agentId: string) {
        try {
            // Check if agent is already in this room or if another agent is already active in this room
            const existingParticipant = await this.prisma.chatParticipant.findMany({
                where: {
                    roomId: roomId,
                    userId: {
                        not: null
                    }
                },
                select: {
                    userId: true,
                    status: true,
                }
            });

            if (existingParticipant && existingParticipant.length > 0 && existingParticipant[0].userId === agentId && existingParticipant[0].status === 'ACTIVE') {
                throw new Error(`Agent ${agentId} is already active in room ${roomId}`);
            } else if (existingParticipant && existingParticipant.length > 0 && existingParticipant[0].userId !== agentId && existingParticipant[0].status === 'ACTIVE') {
                throw new Error(`Another agent with id: ${existingParticipant[0].userId} is already active in room ${roomId}`);
            }

            // 1. CACHE FIRST - Add agent to room participants immediately
            await this.safeRedisOperation(async () => {
                const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);
                await this.redis.sadd(participantsKey, `agent:${agentId}`);
                await this.redis.expire(participantsKey, this.REDIS_EXPIRATIONS.ROOM_PARTICIPANTS);

                // Invalidate room data cache to force refresh with new participant
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE AND VALIDATION (background)
            const analyticsData: any = {
                eventType: 'agent_joined',
                roomId,
                data: {
                    agentId,
                    isPreviousParticipant: existingParticipant && existingParticipant.length > 0 && existingParticipant[0].userId === agentId && existingParticipant[0].status === 'OFFLINE',
                    joinedAt: new Date(),
                },
            };

            await this.analyticsQueue.add('chat-analytics', analyticsData, {
                priority: 2,
                delay: 0,
            });

            this.logger.log(`Agent ${agentId} added to room ${roomId} - validation will be processed in background`, 'ChatService');
            return { success: true, roomId, agentId };
        } catch (error) {
            this.logger.error(`Add agent to room error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async removeAgentFromRoom(roomId: string, agentId: string) {
        try {
            // Check if agent is actually in this room
            const existingParticipant = await this.prisma.chatParticipant.findUnique({
                where: {
                    roomId_userId: {
                        roomId: roomId,
                        userId: agentId,
                    }
                }
            });

            if (!existingParticipant) {
                throw new Error(`Agent ${agentId} is not a participant in room ${roomId}`);
            }

            if (existingParticipant.status !== 'ACTIVE') {
                throw new Error(`Agent ${agentId} is not active in room ${roomId}`);
            }

            // Check current agent capacity for validation
            const agentStatus = await this.prisma.agentStatus.findUnique({
                where: { userId: agentId },
                select: { currentChats: true, maxConcurrentChats: true }
            });

            if (!agentStatus) {
                throw new Error(`Agent ${agentId} status not found`);
            }

            // 1. CACHE FIRST - Remove agent from participants immediately  
            await this.safeRedisOperation(async () => {
                const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);
                await this.redis.srem(participantsKey, `agent:${agentId}`);

                // Invalidate room data cache to force refresh with participant removal
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE AND ANALYTICS (background)
            const analyticsData: any = {
                eventType: 'agent_left',
                roomId,
                data: {
                    agentId,
                    leftAt: new Date(),
                },
            };

            await this.analyticsQueue.add('chat-analytics', analyticsData, {
                priority: 2,
                delay: 0,
            });

            this.logger.log(`Agent ${agentId} removed from room ${roomId} (capacity will be updated to ${Math.max(0, agentStatus.currentChats - 1)}/${agentStatus.maxConcurrentChats})`, 'ChatService');
            return { success: true };
        } catch (error) {
            this.logger.error(`Remove agent from room error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async updateTypingStatus(roomId: string, userType: 'visitor' | 'agent', userId: string, isTyping: boolean): Promise<any> {
        try {
            // Find participant based on user type and ID
            const participant = await this.prisma.chatParticipant.findFirst({
                where: {
                    roomId: roomId,
                    ...(userType === 'visitor'
                        ? { visitorId: userId }
                        : { userId: userId }
                    ),
                },
                select: {
                    id: true,
                    roomId: true,
                    userId: true,
                    visitorId: true,
                    name: true,
                    role: true
                }
            });

            if (!participant) {
                throw new Error(`${userType} ${userId} is not a participant in room ${roomId}`);
            }

            // 1. CACHE FIRST - Update typing status in Redis for real-time access
            await this.safeRedisOperation(async () => {
                const typingKey = this.REDIS_KEYS.TYPING_STATUS(roomId, participant.id);

                if (isTyping) {
                    // Set typing status with expiration (5 minutes)
                    await this.redis.setex(typingKey, this.REDIS_EXPIRATIONS.TYPING_STATUS, JSON.stringify({
                        participantId: participant.id,
                        isTyping: true,
                        createdAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + (this.REDIS_EXPIRATIONS.TYPING_STATUS * 1000)).toISOString(),
                    }));
                } else {
                    // Remove typing status
                    await this.redis.del(typingKey);
                }
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE (background)
            const analyticsData: any = {
                eventType: 'typing_event',
                roomId,
                participantId: participant.id,
                isTyping,
                timestamp: new Date(),
                analytics: {
                    participantId: participant.id,
                    participantType: userType,
                    isTyping,
                },
                typingEvent: {
                    roomId,
                    participantId: participant.id,
                    isTyping,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + (this.REDIS_EXPIRATIONS.TYPING_STATUS * 1000)),
                }
            };

            await this.analyticsQueue.add('chat-analytics', analyticsData, {
                priority: 4, // Lower priority for typing events
                delay: 0,
            });

            this.logger.log(`Typing status updated: ${userType} ${userId} (${participant.name}) in room ${roomId} - ${isTyping ? 'typing' : 'stopped typing'}`, 'ChatService');

            return {
                success: true,
                participantId: participant.id,
                roomId,
                isTyping,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Update typing status error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async markMessageAsDelivered(messageId: string, roomId: string, clientId: string): Promise<any> {
        try {
            // 1. CACHE FIRST - Update message delivery status in cache
            await this.safeRedisOperation(async () => {
                const deliveryKey = this.REDIS_KEYS.MESSAGE_DELIVERY(messageId);
                await this.redis.hset(deliveryKey, {
                    deliveredAt: new Date().toISOString(),
                    roomId: roomId,
                    deliveredToRoom: true,
                    deliveredTo: [clientId],
                });
                await this.redis.expire(deliveryKey, this.REDIS_EXPIRATIONS.MESSAGE_DELIVERY);
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'message_delivered',
                messageId,
                deliveredAt: new Date(),
                roomId: roomId,
                deliveredTo: clientId,
            });

            this.logger.log(`Message ${messageId} marked as delivered to room ${roomId}`, 'ChatService');

            return {
                success: true,
                messageId,
                deliveredTo: clientId,
                deliveredAt: new Date(),
                roomId: roomId,
            };
        } catch (error) {
            this.logger.error(`Mark message as delivered error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async markMessagesAsRead(roomId: string, messageIds: string[], clientId: string, userId?: string, sessionId?: string): Promise<any> {
        try {
            if (!messageIds || messageIds.length === 0) {
                return { success: true, markedCount: 0 };
            }

            // Verify all messages belong to this room and are unread by this user
            const messages = await this.prisma.chatMessage.findMany({
                where: {
                    messageId: { in: messageIds },
                    roomId,
                    readAt: null,
                    senderType: {
                        in: ['visitor', 'agent']
                    },
                },
                select: { messageId: true, createdAt: true }
            });

            if (messages.length === 0) {
                return { success: true, markedCount: 0 };
            }

            // 1. CACHE FIRST - Update read status in cache
            await this.safeRedisOperation(async () => {
                for (const messageId of messageIds) {
                    const readKey = this.REDIS_KEYS.MESSAGE_READ(messageId);
                    await this.redis.hset(readKey, {
                        readAt: new Date().toISOString(),
                        readerId: userId || sessionId || '',
                        readerSocketId: [clientId],
                    });
                    await this.redis.expire(readKey, this.REDIS_EXPIRATIONS.MESSAGE_READ);
                }

                // Clear unread count cache
                const unreadCountKey = this.REDIS_KEYS.ROOM_UNREAD_COUNT(roomId, userId || sessionId || '');
                await this.redis.del(unreadCountKey);
            });

            // 2. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'message_read',
                roomId,
                userId,
                sessionId,
                readerSocketId: clientId,
                readAt: new Date(),
                markedCount: messages.length,
                messageIds: messages.map(m => m.messageId),
                readOptions: {
                    specificMessages: true,
                }
            });

            this.logger.log(`Marked ${messages.length} specific messages as read in room ${roomId} for user ${userId || sessionId || ''}`, 'ChatService');

            return {
                success: true,
                markedCount: messages.length,
                roomId,
                readerId: userId || sessionId || '',
                readerSocketId: clientId,
                messageIds: messages.map(m => m.messageId),
                readAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Mark specific messages as read error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async getChatHistory(workspaceId: string, departmentId?: string, page: number = 1, limit: number = 5, query?: string) {
        try {

            const pageNum = Math.max(1, Number(page) || 1);
            const pageLimit = Math.min(100, Math.max(1, Number(limit) || 10));
            const skip = (pageNum - 1) * pageLimit;

            const whereClause: Prisma.ChatRoomWhereInput = {
                workspaceId,
                ...(departmentId ? { currentServingDepartmentId: departmentId } : { currentServingDepartmentId: null }),
                visitorSession: {
                    status: 'AWAY'
                },
                ...(query ? {
                    OR: [
                        { visitor: { id: { contains: query, mode: 'insensitive' } } },
                        { visitor: { name: { contains: query, mode: 'insensitive' } } },
                        { visitor: { email: { contains: query, mode: 'insensitive' } } },
                        { visitor: { phone: { contains: query, mode: 'insensitive' } } },
                        { messages: { some: { content: { contains: query, mode: 'insensitive' }, senderType: { in: ['visitor', 'agent'] } } } },
                    ]
                } : {})
            }

            const chatRooms = await this.prisma.chatRoom.findMany({
                where: whereClause,
                include: {
                    visitor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                    analytics: true,
                    messages: {
                        where: {
                            senderType: {
                                in: ['visitor', 'agent']
                            }
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                    },
                    participants: {
                        where: {
                            userId: {
                                not: null
                            }
                        },
                        select: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            messages: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
            });

            const chatHistory = chatRooms.slice(0, pageLimit).map(room => ({
                id: room.id,
                visitorId: room.visitor.id,
                visitorName: room.visitor.name,
                visitorEmail: room.visitor.email,
                totalMessages: room._count.messages,
                lastMessage: this.getMatchingMessage(room.messages, query),
                agentsInRoom: room.participants.map(p => p.user),
                createdAt: room.createdAt,
            }));

            return {
                chatHistory,
                total: chatRooms.length,
                page: pageNum,
                limit: pageLimit
            };

        } catch (error) {
            this.logger.error(`Get chat history error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async getMessages(requesterType: 'agent' | 'visitor', roomId: string, page: number = 1, limit: number = 10) {
        try {

            const pageNum = Math.max(1, Number(page) || 1);
            const pageLimit = Math.min(100, Math.max(1, Number(limit) || 10));
            const skip = (pageNum - 1) * pageLimit;

            const whereClause: Prisma.ChatMessageWhereInput = {
                roomId,
                ...(requesterType === 'visitor' ? {
                    senderType: {
                        in: ['visitor', 'agent', 'agent-system']
                    }
                } : {}),
            }

            const messages = await this.prisma.chatMessage.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageLimit,
            });

            return {
                messages: [...messages].reverse(),
                total: messages.length,
                page: pageNum,
                limit: pageLimit
            };

        } catch (error) {
            this.logger.error(`Get messages error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async getVisitorActiveRooms(visitorId: string, workspaceId: string, departmentIds?: string[]): Promise<any[]> {
        try {
            // Get active rooms for this visitor from cache first
            const activeRooms = await this.safeRedisOperation(async () => {
                const workspaceRoomsKey = this.REDIS_KEYS.WORKSPACE_ROOMS(workspaceId);
                const roomIds = await this.redis.zrange(workspaceRoomsKey, 0, -1);

                const visitorRooms: any[] = [];
                for (const roomId of roomIds) {
                    const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);
                    const isParticipant = await this.redis.sismember(participantsKey, `visitor:${visitorId}`);

                    if (isParticipant) {
                        const roomData = await this.redis.get(this.REDIS_KEYS.ROOM_DATA(roomId));
                        // Check visitor session status instead of room status
                        // Room is active unless visitor session status is 'AWAY'
                        if (roomData) {
                            visitorRooms.push(JSON.parse(roomData));
                        }
                    }
                }
                return visitorRooms;
            });

            if (activeRooms && activeRooms.length > 0) {
                return activeRooms;
            }

            // Fallback to database if no cached rooms found
            // Filter by visitor session status - exclude AWAY status
            const dbRooms = await this.prisma.chatRoom.findMany({
                where: {
                    workspaceId,
                    visitorId,
                    visitorSession: {
                        status: {
                            not: 'AWAY', // Exclude rooms where visitor is AWAY
                        },
                    },
                    ...(departmentIds && departmentIds.length > 0 ? {
                        currentServingDepartmentId: { in: departmentIds }
                    } : {}),
                },
                include: {
                    visitorSession: {
                        select: {
                            id: true,
                            status: true,
                            startedAt: true,
                            lastActivityAt: true,
                        },
                    },
                    primaryAgent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            userDepartments: {
                                select: {
                                    departmentId: true,
                                    department: {
                                        select: {
                                            id: true,
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
                orderBy: {
                    lastActivityAt: 'desc',
                },
            });

            // Cache the database results back to Redis for future calls
            if (dbRooms && dbRooms.length > 0) {
                await this.safeRedisOperation(async () => {
                    const workspaceRoomsKey = this.REDIS_KEYS.WORKSPACE_ROOMS(workspaceId);

                    for (const room of dbRooms) {
                        // Add room to workspace rooms sorted set
                        await this.redis.zadd(workspaceRoomsKey, Date.now(), room.id);

                        // Cache room data
                        const roomDataKey = this.REDIS_KEYS.ROOM_DATA(room.id);
                        await this.redis.setex(roomDataKey, this.REDIS_EXPIRATIONS.ROOM_DATA, JSON.stringify(room));

                        // Add visitor as participant
                        const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(room.id);
                        await this.redis.sadd(participantsKey, `visitor:${room.visitorId}`);
                        await this.redis.expire(participantsKey, this.REDIS_EXPIRATIONS.ROOM_PARTICIPANTS);
                    }

                    // Set expiration for workspace rooms
                    await this.redis.expire(workspaceRoomsKey, this.REDIS_EXPIRATIONS.WORKSPACE_ROOMS);
                });
            }

            return dbRooms;
        } catch (error) {
            this.logger.error(`Get visitor active rooms error: ${error.message}`, 'ChatService');
            return [];
        }
    }

    async getAgentActiveRooms(agentId: string, workspaceId: string): Promise<any[]> {
        try {
            // Get active rooms for this agent from cache first
            const activeRooms = await this.safeRedisOperation(async () => {
                const workspaceRoomsKey = this.REDIS_KEYS.WORKSPACE_ROOMS(workspaceId);
                const roomIds = await this.redis.zrange(workspaceRoomsKey, 0, -1);

                const agentRooms: any[] = [];
                for (const roomId of roomIds) {
                    const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);
                    const isParticipant = await this.redis.sismember(participantsKey, `agent:${agentId}`);

                    if (isParticipant) {
                        const roomData = await this.redis.get(this.REDIS_KEYS.ROOM_DATA(roomId));
                        // Check visitor session status instead of room status
                        // Room is active unless visitor session status is 'AWAY'
                        if (roomData) {
                            agentRooms.push(JSON.parse(roomData));
                        }
                    }
                }
                return agentRooms;
            });

            if (activeRooms && activeRooms.length > 0) {
                return activeRooms;
            }

            // Fallback to database if no cached rooms found
            // Filter by visitor session status - exclude AWAY status
            const dbRooms = await this.prisma.chatRoom.findMany({
                where: {
                    workspaceId,
                    participants: {
                        some: {
                            userId: agentId,
                            status: 'ACTIVE', // Use enum value
                        },
                    },
                    visitorSession: {
                        status: {
                            not: 'AWAY', // Exclude rooms where visitor is AWAY
                        },
                    },
                },
                include: {
                    visitorSession: {
                        select: {
                            id: true,
                            userAgent: true,
                            status: true,
                        },
                    },
                    primaryAgent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    participants: {
                        where: { status: 'ACTIVE' },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatarUrl: true,
                                },
                            },
                            visitor: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    lastActivityAt: 'desc',
                },
            });

            return dbRooms;
        } catch (error) {
            this.logger.error(`Get agent active rooms error: ${error.message}`, 'ChatService');
            return [];
        }
    }

    async getVisitorInactiveRooms(visitorId: string, workspaceId: string) {
        try {
            // Filter by visitor session status - only include AWAY status
            const dbRooms = await this.prisma.chatRoom.findMany({
                where: {
                    workspaceId,
                    visitorId,
                    visitorSession: {
                        status: 'AWAY', // Only include rooms where visitor is AWAY
                    },
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    },
                    visitorSession: {
                        select: {
                            id: true,
                            status: true,
                            startedAt: true,
                            lastActivityAt: true,
                            visitor: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        },
                    },
                    primaryAgent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            userDepartments: {
                                select: {
                                    departmentId: true,
                                    department: {
                                        select: {
                                            id: true,
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
                orderBy: {
                    lastActivityAt: 'desc',
                },
            });

            return dbRooms.map(room => ({
                id: room.id,
                lastActivityAt: room.lastActivityAt,
                messages: room.messages.map(message => ({
                    messageId: message.id,
                    content: message.content,
                    senderType: message.senderType,
                    senderId: message.userId,
                    senderName: message.senderType === 'visitor' ? room.visitorSession.visitor?.name : message.senderType === 'agent' ? room.primaryAgent?.name : 'system',
                    createdAt: message.createdAt,
                })),
                primaryAgent: room.primaryAgent,
                lastMessage: [...room.messages].reverse()[0]
            }));
        } catch (error) {
            this.logger.error(`Get visitor inactive rooms error: ${error.message}`, 'ChatService');
            return [];
        }
    }

    async handleChatTransferAcceptance(agentId: string, roomId: string) {
        try {
            // 1. VALIDATE TRANSFER REQUEST
            const room = await this.prisma.chatRoom.findUnique({
                where: { id: roomId },
                include: {
                    primaryAgent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                    participants: {
                        where: {
                            userId: { not: null },
                            status: 'ACTIVE'
                        },
                        select: {
                            id: true,
                            userId: true,
                            name: true,
                            role: true,
                            status: true,
                        }
                    }
                }
            });

            if (!room) {
                throw new Error(`Room ${roomId} not found`);
            }

            // Check if the accepting agent is already a participant
            const acceptingAgentParticipant = room.participants.find(p => p.userId === agentId);
            if (acceptingAgentParticipant) {
                throw new Error(`Agent ${agentId} is already a participant in room ${roomId}`);
            }

            // Get current primary agent (might be null if they already left)
            const currentPrimaryAgent = room.primaryAgent;
            const isPrimaryAgentStillActive = currentPrimaryAgent &&
                room.participants.some(p => p.userId === currentPrimaryAgent.id);

            // Check if the accepting agent has capacity
            const acceptingAgentStatus = await this.prisma.agentStatus.findUnique({
                where: { userId: agentId },
                select: {
                    currentChats: true,
                    maxConcurrentChats: true,
                    status: true
                }
            });

            if (!acceptingAgentStatus) {
                throw new Error(`Agent ${agentId} status not found`);
            }

            if (acceptingAgentStatus.status === 'OFFLINE') {
                throw new Error(`Agent ${agentId} is currently offline`);
            }

            if (acceptingAgentStatus.currentChats >= acceptingAgentStatus.maxConcurrentChats) {
                throw new Error(`Agent ${agentId} is at maximum capacity (${acceptingAgentStatus.currentChats}/${acceptingAgentStatus.maxConcurrentChats})`);
            }

            // 2. CACHE FIRST - Update room participants and metadata immediately
            await this.safeRedisOperation(async () => {
                const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);

                // Only remove current primary agent if they're still active in the room
                if (isPrimaryAgentStillActive && currentPrimaryAgent) {
                    await this.redis.srem(participantsKey, `agent:${currentPrimaryAgent.id}`);
                }

                // Add accepting agent to participants
                await this.redis.sadd(participantsKey, `agent:${agentId}`);
                await this.redis.expire(participantsKey, this.REDIS_EXPIRATIONS.ROOM_PARTICIPANTS);

                // Invalidate room data cache to force refresh with participant changes
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE AND ANALYTICS (background)
            const analyticsData: any = {
                eventType: 'chat_transfer_accepted',
                roomId,
                fromAgentId: currentPrimaryAgent?.id || null,
                toAgentId: agentId,
                transferredAt: new Date(),
                transferData: {
                    fromAgentId: currentPrimaryAgent?.id || null,
                    fromAgentName: currentPrimaryAgent?.name || 'Unknown',
                    toAgentId: agentId,
                    transferReason: 'agent_transfer',
                    transferredAt: new Date(),
                    primaryAgentLeftBeforeTransfer: !isPrimaryAgentStillActive,
                },
                participantUpdates: {
                    // Only include removeParticipant if primary agent is still active
                    ...(isPrimaryAgentStillActive && currentPrimaryAgent ? {
                        removeParticipant: {
                            roomId,
                            userId: currentPrimaryAgent.id,
                            status: 'OFFLINE',
                            leftAt: new Date(),
                            reason: 'transferred_out',
                        }
                    } : {}),
                    // Add accepting agent
                    addParticipant: {
                        roomId,
                        userId: agentId,
                        role: 'agent',
                        status: 'ACTIVE',
                        joinedAt: new Date(),
                        reason: 'transferred_in',
                    }
                },
                analytics: {
                    fromAgentId: currentPrimaryAgent?.id || null,
                    toAgentId: agentId,
                    transferType: 'agent_to_agent',
                    primaryAgentLeftBeforeTransfer: !isPrimaryAgentStillActive,
                },
                sessionHistory: [
                    // Session end for current primary agent (only if they were still active)
                    ...(isPrimaryAgentStillActive && currentPrimaryAgent ? [{
                        sessionType: 'agent_session',
                        participantId: currentPrimaryAgent.id,
                        action: 'left',
                        reason: 'transferred_out',
                        endedAt: new Date(),
                        timestamp: new Date(),
                    }] : []),
                    // Session start for accepting agent
                    {
                        sessionType: 'agent_session',
                        participantId: agentId,
                        action: 'joined',
                        reason: 'transferred_in',
                        startedAt: new Date(),
                        timestamp: new Date(),
                    }
                ],
            };

            await this.analyticsQueue.add('chat-analytics', analyticsData, {
                priority: 1, // High priority for transfers
                delay: 0,
            });

            const transferScenario = isPrimaryAgentStillActive
                ? `transfer with primary agent removal: ${currentPrimaryAgent?.id} -> ${agentId}`
                : `transfer to available room: ${agentId} (primary agent already left)`;

            this.logger.log(`Chat transfer accepted: ${transferScenario} for room ${roomId}`, 'ChatService');

            return {
                success: true,
                roomId,
                fromAgentId: currentPrimaryAgent?.id || null,
                toAgentId: agentId,
                transferredAt: new Date(),
                transferData: {
                    fromAgentId: currentPrimaryAgent?.id || null,
                    fromAgentName: currentPrimaryAgent?.name || 'Unknown',
                    toAgentId: agentId,
                    transferReason: 'agent_transfer',
                    transferredAt: new Date(),
                    primaryAgentLeftBeforeTransfer: !isPrimaryAgentStillActive,
                }
            };

        } catch (error) {
            this.logger.error(`Handle chat transfer acceptance error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async handleChatInvitationAcceptance(agentId: string, roomId: string) {
        try {
            // 1. VALIDATE INVITATION REQUEST
            const room = await this.prisma.chatRoom.findUnique({
                where: { id: roomId },
                include: {
                    primaryAgent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                    participants: {
                        where: {
                            userId: { not: null },
                            status: 'ACTIVE'
                        },
                        select: {
                            id: true,
                            userId: true,
                            name: true,
                            role: true,
                            status: true,
                        }
                    }
                }
            });

            if (!room) {
                throw new Error(`Room ${roomId} not found`);
            }

            // Check if the accepting agent is already a participant
            const acceptingAgentParticipant = room.participants.find(p => p.userId === agentId);
            if (acceptingAgentParticipant) {
                throw new Error(`Agent ${agentId} is already a participant in room ${roomId}`);
            }

            // Check if the accepting agent has capacity
            const acceptingAgentStatus = await this.prisma.agentStatus.findUnique({
                where: { userId: agentId },
                select: {
                    currentChats: true,
                    maxConcurrentChats: true,
                    status: true
                }
            });

            if (!acceptingAgentStatus) {
                throw new Error(`Agent ${agentId} status not found`);
            }

            if (acceptingAgentStatus.status === 'OFFLINE') {
                throw new Error(`Agent ${agentId} is currently offline`);
            }

            if (acceptingAgentStatus.currentChats >= acceptingAgentStatus.maxConcurrentChats) {
                throw new Error(`Agent ${agentId} is at maximum capacity (${acceptingAgentStatus.currentChats}/${acceptingAgentStatus.maxConcurrentChats})`);
            }

            // 2. CACHE FIRST - Add accepting agent to room participants immediately
            await this.safeRedisOperation(async () => {
                const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);

                // Add accepting agent to participants (no removal of primary agent)
                await this.redis.sadd(participantsKey, `agent:${agentId}`);
                await this.redis.expire(participantsKey, this.REDIS_EXPIRATIONS.ROOM_PARTICIPANTS);

                // Invalidate room data cache to force refresh with new participant
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE AND ANALYTICS (background)
            const analyticsData: any = {
                eventType: 'chat_invitation_accepted',
                roomId,
                agentId: agentId,
                joinedAt: new Date(),
                invitationData: {
                    agentId: agentId,
                    invitationReason: 'agent_invitation',
                    joinedAt: new Date(),
                    primaryAgentId: room.primaryAgent?.id || null,
                    primaryAgentName: room.primaryAgent?.name || 'Unknown',
                },
                participantUpdates: {
                    // Add accepting agent (no removal of primary agent)
                    addParticipant: {
                        roomId,
                        userId: agentId,
                        role: 'agent',
                        status: 'ACTIVE',
                        joinedAt: new Date(),
                        reason: 'invitation_accepted',
                    }
                },
                analytics: {
                    agentId: agentId,
                    invitationType: 'agent_invitation',
                    primaryAgentId: room.primaryAgent?.id || null,
                    isSecondaryAgent: true,
                },
                sessionHistory: [
                    // Session start for accepting agent
                    {
                        sessionType: 'agent_session',
                        participantId: agentId,
                        action: 'joined',
                        reason: 'invitation_accepted',
                        startedAt: new Date(),
                        timestamp: new Date(),
                    }
                ],
            };

            await this.analyticsQueue.add('chat-analytics', analyticsData, {
                priority: 2, // Medium priority for invitations
                delay: 0,
            });

            this.logger.log(`Chat invitation accepted: ${agentId} joined room ${roomId} alongside primary agent ${room.primaryAgent?.id || 'None'}`, 'ChatService');

            return {
                success: true,
                roomId,
                agentId: agentId,
                joinedAt: new Date(),
                invitationData: {
                    agentId: agentId,
                    invitationReason: 'agent_invitation',
                    joinedAt: new Date(),
                    primaryAgentId: room.primaryAgent?.id || null,
                    primaryAgentName: room.primaryAgent?.name || 'Unknown',
                    isSecondaryAgent: true,
                }
            };

        } catch (error) {
            this.logger.error(`Handle chat invitation acceptance error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async handleDepartmentTransferRequest(fromDepartmentId: string, toDepartmentId: string, roomId: string, workspaceId: string) {

        try {
            // 1. CACHE FIRST - Get room data from cache
            const roomKey = this.REDIS_KEYS.ROOM_DATA(roomId);
            let roomData = await this.safeRedisOperation(async () => {
                return await this.redis.get(roomKey);
            });

            if (!roomData) {
                // Fallback to database if not in cache
                const dbRoom = await this.prisma.chatRoom.findFirst({
                    where: {
                        id: roomId,
                        workspaceId: workspaceId,
                        currentServingDepartmentId: fromDepartmentId,
                    },
                    include: {
                        departments: true,
                    },
                });

                if (!dbRoom) {
                    throw new NotFoundException(`Chat room ${roomId} not found`);
                }

                roomData = JSON.stringify({
                    id: dbRoom.id,
                    workspaceId: dbRoom.workspaceId,
                    visitorId: dbRoom.visitorId,
                    visitorSessionId: dbRoom.visitorSessionId,
                    currentServingDepartmentId: dbRoom.currentServingDepartmentId || '',
                    createdAt: dbRoom.createdAt.toISOString(),
                    lastActivityAt: dbRoom.lastActivityAt.toISOString(),
                    departments: dbRoom.departments.map(dept => dept.id).join(','),
                });
            }

            // 2. CACHE FIRST - Update room data in cache immediately
            await this.safeRedisOperation(async () => {
                // Add to department list if not already present
                const departmentsKey = this.REDIS_KEYS.ROOM_DEPARTMENTS(roomId);
                await this.redis.sadd(departmentsKey, toDepartmentId);
                await this.redis.expire(departmentsKey, this.REDIS_EXPIRATIONS.ROOM_DATA);

                // Invalidate room data cache to force refresh with department changes
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'department_transfer',
                data: {
                    roomId,
                    workspaceId,
                    fromDepartmentId,
                    toDepartmentId,
                    transferredAt: new Date(),
                    reason: 'department_transfer_request',
                }
            });

            this.logger.log(`Department transfer request initiated: ${fromDepartmentId} -> ${toDepartmentId} for room ${roomId}`, 'ChatService');

            return {
                success: true,
                roomId,
                fromDepartmentId,
                toDepartmentId,
                transferredAt: new Date(),
                message: `Department ${toDepartmentId} added to chatroom ${roomId} for transfer request`,
            };

        } catch (error) {
            this.logger.error(`Department transfer request error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async handleAcceptDepartmentTransfer(fromDepartmentId: string, toDepartmentId: string, roomId: string, workspaceId: string) {

        try {
            // 1. CACHE FIRST - Get room data from cache
            const roomKey = this.REDIS_KEYS.ROOM_DATA(roomId);
            let roomData = await this.safeRedisOperation(async () => {
                return await this.redis.get(roomKey);
            });

            if (!roomData) {
                // Fallback to database if not in cache
                const dbRoom = await this.prisma.chatRoom.findFirst({
                    where: {
                        id: roomId,
                        workspaceId: workspaceId,
                        currentServingDepartmentId: fromDepartmentId,
                    },
                    include: {
                        departments: true,
                    },
                });

                if (!dbRoom) {
                    throw new NotFoundException(`Chat room ${roomId} not found`);
                }

                roomData = JSON.stringify({
                    id: dbRoom.id,
                    workspaceId: dbRoom.workspaceId,
                    visitorId: dbRoom.visitorId,
                    visitorSessionId: dbRoom.visitorSessionId,
                    currentServingDepartmentId: dbRoom.currentServingDepartmentId || '',
                    createdAt: dbRoom.createdAt.toISOString(),
                    lastActivityAt: dbRoom.lastActivityAt.toISOString(),
                    departments: dbRoom.departments.map(dept => dept.id).join(','),
                });
            }

            // 2. CACHE FIRST - Update room data in cache immediately
            await this.safeRedisOperation(async () => {
                // Update current serving department to toDepartment
                await this.redis.hset(this.REDIS_KEYS.ROOM_CURRENT_DEPARTMENT(roomId), {
                    currentServingDepartmentId: toDepartmentId,
                    lastActivityAt: new Date().toISOString(),
                });

                // Remove fromDepartment from departments list
                const departmentsKey = this.REDIS_KEYS.ROOM_DEPARTMENTS(roomId);
                await this.redis.srem(departmentsKey, fromDepartmentId);
                await this.redis.expire(departmentsKey, this.REDIS_EXPIRATIONS.ROOM_DATA);

                // Invalidate room data cache to force refresh with department changes
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'department_transfer_accepted',
                data: {
                    roomId,
                    workspaceId,
                    fromDepartmentId,
                    toDepartmentId,
                    acceptedAt: new Date(),
                    reason: 'department_transfer_accepted',
                }
            });

            this.logger.log(`Department transfer acceptance completed: ${fromDepartmentId} -> ${toDepartmentId} for room ${roomId}`, 'ChatService');

            return {
                success: true,
                roomId,
                fromDepartmentId,
                toDepartmentId,
                acceptedAt: new Date(),
                message: `Department transfer accepted: ${fromDepartmentId} -> ${toDepartmentId}`,
            };

        } catch (error) {
            this.logger.error(`Department transfer acceptance error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async handleCancelDepartmentTransfer(fromDepartmentId: string, toDepartmentId: string, roomId: string, workspaceId: string) {

        try {
            // 1. CACHE FIRST - Get room data from cache
            const roomKey = this.REDIS_KEYS.ROOM_DATA(roomId);
            let roomData = await this.safeRedisOperation(async () => {
                return await this.redis.get(roomKey);
            });

            if (!roomData) {
                // Fallback to database if not in cache
                const dbRoom = await this.prisma.chatRoom.findFirst({
                    where: {
                        id: roomId,
                        workspaceId: workspaceId,
                        currentServingDepartmentId: fromDepartmentId,
                    },
                    include: {
                        departments: true,
                    },
                });

                if (!dbRoom) {
                    throw new NotFoundException(`Chat room ${roomId} not found`);
                }

                roomData = JSON.stringify({
                    id: dbRoom.id,
                    workspaceId: dbRoom.workspaceId,
                    visitorId: dbRoom.visitorId,
                    visitorSessionId: dbRoom.visitorSessionId,
                    currentServingDepartmentId: dbRoom.currentServingDepartmentId || '',
                    createdAt: dbRoom.createdAt.toISOString(),
                    lastActivityAt: dbRoom.lastActivityAt.toISOString(),
                    departments: dbRoom.departments.map(dept => dept.id).join(','),
                });
            }

            // 2. CACHE FIRST - Update room data in cache immediately
            await this.safeRedisOperation(async () => {
                // Remove from department list
                const departmentsKey = this.REDIS_KEYS.ROOM_DEPARTMENTS(roomId);
                await this.redis.srem(departmentsKey, toDepartmentId);
                await this.redis.expire(departmentsKey, this.REDIS_EXPIRATIONS.ROOM_DATA);

                // Invalidate room data cache to force refresh with department changes
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'department_transfer_cancelled',
                data: {
                    roomId,
                    workspaceId,
                    fromDepartmentId,
                    toDepartmentId,
                    cancelledAt: new Date(),
                    reason: 'department_transfer_cancelled',
                }
            });

            this.logger.log(`Department transfer cancellation completed: ${toDepartmentId} removed from room ${roomId}`, 'ChatService');

            return {
                success: true,
                roomId,
                fromDepartmentId,
                toDepartmentId,
                cancelledAt: new Date(),
                message: `Department ${toDepartmentId} removed from chatroom ${roomId} departments list`,
            };

        } catch (error) {
            this.logger.error(`Department transfer cancellation error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async handleInviteDepartmentToChat(fromDepartmentId: string, toDepartmentId: string, roomId: string, workspaceId: string) {
        try {
            // 1. CACHE FIRST - Get room data from cache
            const roomKey = this.REDIS_KEYS.ROOM_DATA(roomId);
            let roomData = await this.safeRedisOperation(async () => {
                return await this.redis.get(roomKey);
            });

            if (!roomData) {
                // Fallback to database if not in cache
                const dbRoom = await this.prisma.chatRoom.findFirst({
                    where: {
                        id: roomId,
                        workspaceId: workspaceId,
                        currentServingDepartmentId: fromDepartmentId,
                    },
                    include: {
                        departments: true,
                    },
                });

                if (!dbRoom) {
                    throw new NotFoundException(`Chat room ${roomId} not found`);
                }

                roomData = JSON.stringify({
                    id: dbRoom.id,
                    workspaceId: dbRoom.workspaceId,
                    visitorId: dbRoom.visitorId,
                    visitorSessionId: dbRoom.visitorSessionId,
                    currentServingDepartmentId: dbRoom.currentServingDepartmentId || '',
                    createdAt: dbRoom.createdAt.toISOString(),
                    lastActivityAt: dbRoom.lastActivityAt.toISOString(),
                    departments: dbRoom.departments.map(dept => dept.id).join(','),
                });
            }

            // 2. CACHE FIRST - Update room data in cache immediately
            await this.safeRedisOperation(async () => {
                // Add to department list if not already present
                const departmentsKey = this.REDIS_KEYS.ROOM_DEPARTMENTS(roomId);
                await this.redis.sadd(departmentsKey, toDepartmentId);
                await this.redis.expire(departmentsKey, this.REDIS_EXPIRATIONS.ROOM_DATA);

                // Invalidate room data cache to force refresh with department changes
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'department_invitation',
                data: {
                    roomId,
                    workspaceId,
                    fromDepartmentId,
                    toDepartmentId,
                    invitedAt: new Date(),
                    reason: 'department_invitation',
                }
            });

            this.logger.log(`Department invitation sent: ${fromDepartmentId} -> ${toDepartmentId} for room ${roomId}`, 'ChatService');

            return {
                success: true,
                roomId,
                fromDepartmentId,
                toDepartmentId,
                invitedAt: new Date(),
                message: `Department ${toDepartmentId} invited to chatroom ${roomId}`,
            };

        } catch (error) {
            this.logger.error(`Department invitation error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async handleAcceptDepartmentInvitation(agentId: string, currentDepartmentId: string, roomId: string, workspaceId: string) {
        try {
            // 1. VALIDATE DEPARTMENT INVITATION REQUEST
            const room = await this.prisma.chatRoom.findUnique({
                where: {
                    id: roomId,
                    workspaceId: workspaceId,
                    departments: {
                        some: {
                            id: currentDepartmentId
                        }
                    }
                },
                include: {
                    departments: true,
                    primaryAgent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                    participants: {
                        where: {
                            userId: { not: null },
                            status: 'ACTIVE'
                        },
                        select: {
                            id: true,
                            userId: true,
                            name: true,
                            role: true,
                            status: true,
                        }
                    }
                }
            });

            if (!room) {
                throw new Error(`Room ${roomId} not found or not associated with department ${currentDepartmentId}`);
            }

            // Check if the accepting agent is already a participant
            const acceptingAgentParticipant = room.participants.find(p => p.userId === agentId);
            if (acceptingAgentParticipant) {
                throw new Error(`Agent ${agentId} is already a participant in room ${roomId}`);
            }

            // Check if the accepting agent has capacity
            const acceptingAgentStatus = await this.prisma.agentStatus.findUnique({
                where: { userId: agentId },
                select: {
                    currentChats: true,
                    maxConcurrentChats: true,
                    status: true
                }
            });

            if (!acceptingAgentStatus) {
                throw new Error(`Agent ${agentId} status not found`);
            }

            if (acceptingAgentStatus.status === 'OFFLINE') {
                throw new Error(`Agent ${agentId} is currently offline`);
            }

            if (acceptingAgentStatus.currentChats >= acceptingAgentStatus.maxConcurrentChats) {
                throw new Error(`Agent ${agentId} is at maximum capacity (${acceptingAgentStatus.currentChats}/${acceptingAgentStatus.maxConcurrentChats})`);
            }

            // 2. CACHE FIRST - Add accepting agent to room participants immediately
            await this.safeRedisOperation(async () => {
                const participantsKey = this.REDIS_KEYS.ROOM_PARTICIPANTS(roomId);

                // Add accepting agent to participants
                await this.redis.sadd(participantsKey, `agent:${agentId}`);
                await this.redis.expire(participantsKey, this.REDIS_EXPIRATIONS.ROOM_PARTICIPANTS);

                // Invalidate room data cache to force refresh with new participant
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE AND ANALYTICS (background)
            const analyticsData: any = {
                eventType: 'department_invitation_accepted',
                roomId,
                workspaceId,
                agentId: agentId,
                currentDepartmentId,
                acceptedAt: new Date(),
                invitationData: {
                    agentId: agentId,
                    invitationReason: 'department_invitation',
                    acceptedAt: new Date(),
                    currentDepartmentId,
                    primaryAgentId: room.primaryAgent?.id || null,
                    primaryAgentName: room.primaryAgent?.name || 'Unknown',
                },
                participantUpdates: {
                    // Add accepting agent
                    addParticipant: {
                        roomId,
                        userId: agentId,
                        role: 'agent',
                        status: 'ACTIVE',
                        joinedAt: new Date(),
                        reason: 'department_invitation_accepted',
                    }
                },
                analytics: {
                    agentId: agentId,
                    invitationType: 'department_invitation',
                    currentDepartmentId,
                    primaryAgentId: room.primaryAgent?.id || null,
                    isSecondaryAgent: true,
                },
                sessionHistory: [
                    // Session start for accepting agent
                    {
                        sessionType: 'agent_session',
                        participantId: agentId,
                        action: 'joined',
                        reason: 'department_invitation_accepted',
                        startedAt: new Date(),
                        timestamp: new Date(),
                    }
                ],
            };

            await this.analyticsQueue.add('chat-analytics', analyticsData, {
                priority: 2, // Medium priority for invitations
                delay: 0,
            });

            this.logger.log(`Department invitation accepted: ${agentId} joined room ${roomId} for department ${currentDepartmentId}`, 'ChatService');

            return {
                success: true,
                roomId,
                workspaceId,
                agentId: agentId,
                currentDepartmentId,
                acceptedAt: new Date(),
                invitationData: {
                    agentId: agentId,
                    invitationReason: 'department_invitation',
                    acceptedAt: new Date(),
                    currentDepartmentId,
                    primaryAgentId: room.primaryAgent?.id || null,
                    primaryAgentName: room.primaryAgent?.name || 'Unknown',
                    isSecondaryAgent: true,
                }
            };

        } catch (error) {
            this.logger.error(`Handle department invitation acceptance error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    async handleRejectDepartmentInvitation(agentId: string, currentDepartmentId: string, roomId: string, workspaceId: string) {
        try {
            // 1. CACHE FIRST - Get room data from cache
            const roomKey = this.REDIS_KEYS.ROOM_DATA(roomId);
            let roomData = await this.safeRedisOperation(async () => {
                return await this.redis.get(roomKey);
            });

            if (!roomData) {
                // Fallback to database if not in cache
                const dbRoom = await this.prisma.chatRoom.findFirst({
                    where: {
                        id: roomId,
                        workspaceId: workspaceId,
                    },
                    include: {
                        departments: true,
                    },
                });

                if (!dbRoom) {
                    throw new NotFoundException(`Chat room ${roomId} not found`);
                }

                roomData = JSON.stringify({
                    id: dbRoom.id,
                    workspaceId: dbRoom.workspaceId,
                    visitorId: dbRoom.visitorId,
                    visitorSessionId: dbRoom.visitorSessionId,
                    currentServingDepartmentId: dbRoom.currentServingDepartmentId || '',
                    createdAt: dbRoom.createdAt.toISOString(),
                    lastActivityAt: dbRoom.lastActivityAt.toISOString(),
                    departments: dbRoom.departments.map(dept => dept.id).join(','),
                });
            }

            // 2. CACHE FIRST - Update room data in cache immediately
            await this.safeRedisOperation(async () => {
                // Remove from department list
                const departmentsKey = this.REDIS_KEYS.ROOM_DEPARTMENTS(roomId);
                await this.redis.srem(departmentsKey, currentDepartmentId);
                await this.redis.expire(departmentsKey, this.REDIS_EXPIRATIONS.ROOM_DATA);

                // Invalidate room data cache to force refresh with department changes
                await this.redis.del(this.REDIS_KEYS.ROOM_DATA(roomId));
            });

            // 3. QUEUE FOR DATABASE PERSISTENCE (background)
            await this.analyticsQueue.add('chat-analytics', {
                eventType: 'department_invitation_rejected',
                data: {
                    roomId,
                    workspaceId,
                    agentId,
                    currentDepartmentId,
                    rejectedAt: new Date(),
                    reason: 'department_invitation_rejected',
                }
            });

            this.logger.log(`Department invitation rejection completed: ${currentDepartmentId} removed from room ${roomId}`, 'ChatService');

            return {
                success: true,
                roomId,
                agentId,
                currentDepartmentId,
                rejectedAt: new Date(),
                message: `Department ${currentDepartmentId} removed from chatroom ${roomId} departments list`,
            };

        } catch (error) {
            this.logger.error(`Department invitation rejection error: ${error.message}`, 'ChatService');
            throw error;
        }
    }

    // BullMQ Job Creation Methods (keeping these for background persistence)
    private async queueNewChatNotification(chatRoom: any) {
        try {
            await this.notificationsQueue.add('chat_notification', {
                type: 'new_chat_request',
                data: {
                    roomId: chatRoom.id,
                    visitorId: chatRoom.visitorId,
                    workspaceId: chatRoom.workspaceId,
                    visitorSessionId: chatRoom.visitorSessionId, // Include session ID
                    timestamp: new Date(),
                }
            }, {
                priority: 3, // Default priority since room priority was removed
                delay: 0,
            });

            this.logger.log(`New chat notification queued for room ${chatRoom.id}`, 'ChatService');
        } catch (error) {
            this.logger.error(`Queue new chat notification error: ${error.message}`, 'ChatService');
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
                this.logger.log(`Redis circuit breaker reset`, 'ChatService');
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
                this.logger.error(`Redis circuit breaker opened after ${this.redisFailureCount} failures`, 'ChatService');
            }
            this.logger.error(`Redis operation failed: ${error.message}`, 'ChatService');
            return null;
        }
    }

    private getMatchingMessage(messages: any[], query?: string) {
        if (!Array.isArray(messages) || messages.length === 0) return null;
        if (!query || query === '') return messages[0] ?? null;

        for (const message of messages) {
            const content: string = message?.content ?? '';
            if (content.length < query.length) continue;
            if (content.indexOf(query) !== -1) return message;
        }
        return messages[0];
    }

    onModuleDestroy() {
        // Clean shutdown - no timers to clear anymore
        this.logger.log('ChatService shutting down', 'ChatService');
    }
}