import { Injectable } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';

@Injectable()
export class ChatAnalyticsProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        private readonly redis: Redis,
    ) { }

    createWorker(): Worker {
        return new Worker('chat-analytics', async (job) => {
            this.logger.log(`Processing chat analytics job: ${job.id}`, 'ChatAnalyticsProcessor');

            try {
                const { roomId, eventType, data } = job.data;

                switch (eventType) {
                    // CRITICAL: Room and message persistence
                    case 'room_created':
                        await this.processRoomCreation(job.data);
                        break;
                    case 'message_created':
                        await this.processMessageCreation(job.data);
                        break;

                    // Analytics events
                    case 'message_sent':
                        await this.processMessageAnalytics(roomId, data);
                        break;
                    case 'agent_joined':
                        await this.processAgentJoinAnalytics(roomId, data);
                        break;
                    case 'agent_left':
                        await this.processAgentLeaveAnalytics(roomId, data);
                        break;
                    case 'chat_ended':
                        await this.processChatEndAnalytics(roomId, job.data);
                        break;
                    case 'message_delivered':
                        await this.processMessageDeliveryAnalytics(roomId, job.data);
                        break;
                    case 'message_read':
                        await this.processMessageReadAnalytics(roomId, job.data);
                        break;

                    // Agent operations
                    case 'agent_status_updated':
                        await this.processAgentStatusUpdate(job.data);
                        break;
                    case 'agent_capacity_updated':
                        await this.processAgentCapacityUpdate(job.data);
                        break;
                    case 'agent_event':
                        await this.processAgentEvent(job.data);
                        break;
                    case 'chat_transfer_accepted':
                        await this.processChatTransferAccepted(roomId, job.data);
                        break;
                    case 'chat_invitation_accepted':
                        await this.processChatInvitationAccepted(roomId, job.data);
                        break;
                    case 'department_transfer':
                        await this.processDepartmentTransfer(job.data);
                        break;
                    case 'department_transfer_cancelled':
                        await this.processDepartmentTransferCancelled(job.data);
                        break;
                    case 'department_transfer_accepted':
                        await this.processDepartmentTransferAccepted(job.data);
                        break;
                    case 'department_invitation':
                        await this.processDepartmentInvitation(job.data);
                        break;
                    case 'department_invitation_accepted':
                        await this.processDepartmentInvitationAccepted(job.data);
                        break;
                    case 'department_invitation_rejected':
                        await this.processDepartmentInvitationRejected(job.data);
                        break;

                    // Visitor operations
                    case 'visitor_session_created':
                        await this.processVisitorSessionCreated(job.data);
                        break;
                    case 'visitor_session_ended':
                        await this.processVisitorSessionEnded(job.data);
                        break;
                    case 'visitor_activity_tracked':
                        await this.processVisitorActivityTracked(job.data);
                        break;
                    case 'visitor_info_updated':
                        await this.processVisitorInfoUpdated(job.data);
                        break;
                    case 'visitor_session_context_updated':
                        await this.processVisitorSessionContextUpdated(job.data);
                        break;
                    case 'visitor_session_status_updated':
                        await this.processVisitorSessionStatusUpdated(job.data);
                        break;
                    case 'visitor_analytics_updated':
                        await this.processVisitorAnalyticsUpdated(job.data);
                        break;

                    // Typing events
                    case 'typing_event':
                        await this.processTypingEvent(job.data);
                        break;

                    // Chat Analytics Calculations
                    case 'calculate_first_response_time':
                        await this.calculateFirstResponseTime(job.data);
                        break;
                    case 'calculate_average_response_time':
                        await this.calculateAverageResponseTime(job.data);
                        break;
                    case 'calculate_chat_duration':
                        await this.calculateChatDuration(job.data);
                        break;

                    // Session History Tracking
                    case 'chat_session_history_created':
                        await this.processChatSessionHistory(job.data);
                        break;

                    // Performance Metrics
                    case 'chat_performance_metric_recorded':
                        await this.processChatPerformanceMetric(job.data);
                        break;

                    default:
                        this.logger.warn(`Unknown analytics event type: ${eventType}`, 'ChatAnalyticsProcessor');
                }

                this.logger.log(`Chat analytics processed for room: ${roomId}, event: ${eventType}`, 'ChatAnalyticsProcessor');
            } catch (error) {
                this.logger.error(`Chat analytics processing error: ${error.message}`, 'ChatAnalyticsProcessor');
                throw error;
            }
        }, {
            connection: this.redis,
            concurrency: 2,
        });
    }

    // Helper method to check if room exists
    private async ensureRoomExists(roomId: string | null | undefined, jobType: string): Promise<boolean> {
        if (!roomId) {
            this.logger.warn(`Skipping ${jobType} analytics - no roomId provided`, 'ChatAnalyticsProcessor');
            return false;
        }

        const roomExists = await this.prisma.chatRoom.findUnique({
            where: { id: roomId },
            select: { id: true }
        });

        if (!roomExists) {
            this.logger.warn(`Skipping ${jobType} analytics for non-existent room: ${roomId} - will be retried by BullMQ`, 'ChatAnalyticsProcessor');
            return false;
        }

        return true;
    }

    private async processMessageAnalytics(roomId: string | null | undefined, data: any) {
        try {
            // Check if room exists before creating analytics
            if (!(await this.ensureRoomExists(roomId, 'message'))) {
                return;
            }

            if (!roomId) {
                return;
            }

            // Update message counts in analytics
            const analytics = await this.prisma.chatAnalytics.upsert({
                where: { roomId },
                update: {
                    messageCount: { increment: 1 },
                    ...(data.senderType === 'visitor' && { visitorMessageCount: { increment: 1 } }),
                    ...(data.senderType === 'agent' && { agentMessageCount: { increment: 1 } }),
                    ...(data.isInternal && { internalMessageCount: { increment: 1 } }),
                },
                create: {
                    roomId,
                    messageCount: 1,
                    visitorMessageCount: data.senderType === 'visitor' ? 1 : 0,
                    agentMessageCount: data.senderType === 'agent' ? 1 : 0,
                    internalMessageCount: data.isInternal ? 1 : 0,
                },
            });

            // Calculate average message length
            const messages = await this.prisma.chatMessage.findMany({
                where: { roomId },
                select: { content: true },
            });

            const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
            const avgLength = messages.length > 0 ? totalLength / messages.length : 0;

            // Cache analytics data
            await this.redis.setex(
                `chat:analytics:${roomId}:message_stats`,
                3600,
                JSON.stringify({
                    totalMessages: analytics.messageCount,
                    avgMessageLength: avgLength,
                    lastUpdated: new Date(),
                })
            );

            this.logger.log(`Message analytics updated for room ${roomId}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process message analytics error for room ${roomId}: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processAgentJoinAnalytics(roomId: string | null | undefined, data: any) {
        try {
            // Check if room exists before updating analytics
            if (!(await this.ensureRoomExists(roomId, 'agent_join'))) {
                return;
            }

            if (!roomId) {
                return;
            }

            // VALIDATION: Check agent capacity and status
            const agentStatus = await this.prisma.agentStatus.findUnique({
                where: { userId: data.agentId },
                select: {
                    currentChats: true,
                    maxConcurrentChats: true,
                    status: true
                }
            });

            if (!agentStatus) {
                this.logger.error(`Agent ${data.agentId} status not found - cannot join room ${roomId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Check if agent is available (not OFFLINE)
            if (agentStatus.status === 'OFFLINE') {
                this.logger.error(`Agent ${data.agentId} is currently offline - cannot join room ${roomId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Check if agent has capacity for another chat
            if (agentStatus.currentChats >= agentStatus.maxConcurrentChats) {
                this.logger.error(`Agent ${data.agentId} is at maximum capacity (${agentStatus.currentChats}/${agentStatus.maxConcurrentChats} chats) - cannot join room ${roomId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Get current room state to determine the scenario
            const room = await this.prisma.chatRoom.findUnique({
                where: { id: roomId },
                select: {
                    primaryAgentId: true,
                    participants: {
                        where: {
                            userId: { not: null },
                            status: 'ACTIVE'
                        },
                        select: {
                            id: true,
                            userId: true,
                            status: true,
                        }
                    },
                }
            });

            // Determine the join scenario
            const isFirstAgent = !room?.primaryAgentId;
            const isRejoiningAgent = data.isPreviousParticipant;
            const isReplacingAgent = !isFirstAgent && !isRejoiningAgent && room?.participants.length === 0;

            // Create agent participant in database if needed
            if (!isRejoiningAgent && !isReplacingAgent) {
                // Get agent details for participant creation
                const agent = await this.prisma.user.findUnique({
                    where: { id: data.agentId },
                    select: { name: true, email: true, avatarUrl: true }
                });

                if (agent) {
                    await this.prisma.chatParticipant.create({
                        data: {
                            roomId: roomId,
                            userId: data.agentId, // For agents
                            visitorId: null, // For visitors (null for agents)
                            name: agent.name,
                            email: agent.email,
                            avatarUrl: agent.avatarUrl,
                            role: 'agent',
                            status: 'ACTIVE',
                            joinedAt: new Date(data.joinedAt || new Date()),
                        },
                    });
                }
            } else {
                // Update existing participant to active status
                await this.prisma.chatParticipant.update({
                    where: {
                        roomId_userId: {
                            roomId: roomId,
                            userId: data.agentId,
                        }
                    },
                    data: {
                        status: 'ACTIVE',
                        leftAt: null, // Clear any previous leave timestamp
                        joinedAt: new Date(data.joinedAt || new Date()),
                    },
                });
            }

            // Update agent capacity (increment current chats)
            await this.prisma.agentStatus.update({
                where: { userId: data.agentId },
                data: {
                    currentChats: { increment: 1 },
                    currentRoomId: roomId,
                    lastSeenAt: new Date(),
                },
            });

            // Handle primary agent assignment based on scenario
            if (isFirstAgent) {
                // Scenario 1: First agent joining - assign as primary
                await this.prisma.chatRoom.update({
                    where: { id: roomId },
                    data: {
                        primaryAgentId: data.agentId,
                        assignedAt: new Date(data.joinedAt || new Date()),
                    },
                });

                // Update Redis cache with primary agent information
                await this.redis.hset(
                    `room:${roomId}:metadata`,
                    'primaryAgentId',
                    data.agentId
                );
                await this.redis.expire(`room:${roomId}:metadata`, 86400); // 24 hours

                this.logger.log(`Agent ${data.agentId} assigned as primary agent for room ${roomId}`, 'ChatAnalyticsProcessor');
            } else if (isReplacingAgent) {
                // Scenario 3: Replacing offline agent - update primary agent
                await this.prisma.chatRoom.update({
                    where: { id: roomId },
                    data: {
                        primaryAgentId: data.agentId,
                        assignedAt: new Date(data.joinedAt || new Date()),
                    },
                });

                // Update Redis cache with new primary agent
                await this.redis.hset(
                    `room:${roomId}:metadata`,
                    'primaryAgentId',
                    data.agentId
                );
                await this.redis.expire(`room:${roomId}:metadata`, 86400); // 24 hours

                this.logger.log(`Agent ${data.agentId} replaced previous agent as primary for room ${roomId}`, 'ChatAnalyticsProcessor');
            }

            // Update agent count in analytics
            await this.prisma.chatAnalytics.upsert({
                where: { roomId },
                update: {
                    agentCount: { increment: 1 },
                    participantCount: { increment: 1 },
                },
                create: {
                    roomId,
                    agentCount: 1,
                    participantCount: 1,
                    messageCount: 0,
                    visitorMessageCount: 0,
                    agentMessageCount: 0,
                    internalMessageCount: 0,
                },
            });

            // Calculate first response time only for first agent or replacing agent
            if (isFirstAgent || isReplacingAgent) {
                const roomWithMessages = await this.prisma.chatRoom.findUnique({
                    where: { id: roomId },
                    include: { messages: { orderBy: { createdAt: 'asc' } } },
                });

                if (roomWithMessages && roomWithMessages.messages.length > 0) {
                    const firstVisitorMessage = roomWithMessages.messages.find(m => m.senderType === 'visitor');
                    const firstAgentMessage = roomWithMessages.messages.find(m => m.senderType === 'agent');

                    if (firstVisitorMessage && firstAgentMessage) {
                        const responseTime = firstAgentMessage.createdAt.getTime() - firstVisitorMessage.createdAt.getTime();

                        await this.prisma.chatAnalytics.update({
                            where: { roomId },
                            data: { firstResponseTime: responseTime },
                        });
                    }
                }
            }

            // Create session history for agent join with appropriate reason
            let sessionReason;
            if (isFirstAgent) {
                sessionReason = 'agent_assignment';
            } else if (isRejoiningAgent) {
                sessionReason = 'agent_rejoined';
            } else if (isReplacingAgent) {
                sessionReason = 'agent_replacement';
            } else {
                sessionReason = 'agent_joined';
            }

            // Get the ChatParticipant record to use its ID for session history
            const participant = await this.prisma.chatParticipant.findUnique({
                where: {
                    roomId_userId: {
                        roomId: roomId,
                        userId: data.agentId,
                    }
                },
                select: { id: true }
            });

            if (participant) {
                await this.prisma.chatSessionHistory.create({
                    data: {
                        roomId: roomId,
                        sessionType: 'agent_session',
                        participantId: participant.id, // Use ChatParticipant.id, not user ID
                        action: 'joined',
                        reason: sessionReason,
                        startedAt: new Date(data.joinedAt || new Date()),
                        endedAt: null,
                        duration: null,
                    },
                });
            } else {
                this.logger.error(`ChatParticipant not found for agent ${data.agentId} in room ${roomId} - cannot create session history`, 'ChatAnalyticsProcessor');
            }

            // Enhanced logging with scenario information
            let scenarioDescription;
            if (isFirstAgent) {
                scenarioDescription = 'first agent (primary)';
            } else if (isRejoiningAgent) {
                scenarioDescription = 'rejoining agent';
            } else if (isReplacingAgent) {
                scenarioDescription = 'replacing offline agent';
            } else {
                scenarioDescription = 'additional agent';
            }

            this.logger.log(`Agent join analytics updated for room ${roomId} - ${scenarioDescription} - capacity: ${agentStatus.currentChats + 1}/${agentStatus.maxConcurrentChats}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process agent join analytics error for room ${roomId}: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processAgentLeaveAnalytics(roomId: string | null | undefined, data: any) {
        try {
            if (!roomId) {
                return;
            }

            // Check if this agent is the primary agent
            const room = await this.prisma.chatRoom.findUnique({
                where: { id: roomId },
                select: {
                    primaryAgentId: true
                }
            });

            const isPrimaryAgent = room?.primaryAgentId === data.agentId;

            // Remove agent from participants
            const existingParticipant = await this.prisma.chatParticipant.findUnique({
                where: {
                    roomId_userId: {
                        roomId: roomId,
                        userId: data.agentId,
                    }
                }
            });

            if (existingParticipant) {
                // Update existing participant status
                await this.prisma.chatParticipant.update({
                    where: {
                        roomId_userId: {
                            roomId: roomId,
                            userId: data.agentId,
                        }
                    },
                    data: {
                        status: 'OFFLINE',
                        leftAt: new Date(data.leftAt || new Date()),
                    },
                });
            } else {
                // Create participant record if it doesn't exist (edge case)
                const agent = await this.prisma.user.findUnique({
                    where: { id: data.agentId },
                    select: { name: true, email: true, avatarUrl: true }
                });

                if (agent) {
                    await this.prisma.chatParticipant.create({
                        data: {
                            roomId: roomId,
                            userId: data.agentId,
                            visitorId: null,
                            name: agent.name,
                            email: agent.email,
                            avatarUrl: agent.avatarUrl,
                            role: 'agent',
                            status: 'OFFLINE',
                            joinedAt: new Date(data.joinedAt || new Date()),
                            leftAt: new Date(data.leftAt || new Date()),
                        },
                    });
                }
            }

            // Update agent capacity (decrement current chats)
            const agentStatus = await this.prisma.agentStatus.findUnique({
                where: { userId: data.agentId },
                select: { currentChats: true, currentRoomId: true }
            });

            if (agentStatus) {
                const newCurrentChats = Math.max(0, agentStatus.currentChats - 1);
                const newCurrentRoomId = agentStatus.currentRoomId === roomId ? null : agentStatus.currentRoomId;

                await this.prisma.agentStatus.update({
                    where: { userId: data.agentId },
                    data: {
                        currentChats: newCurrentChats,
                        currentRoomId: newCurrentRoomId,
                        lastSeenAt: new Date(),
                    },
                });

                this.logger.log(`Agent ${data.agentId} capacity updated: ${newCurrentChats} current chats`, 'ChatAnalyticsProcessor');
            }

            // If this was the primary agent, clear the primary agent assignment
            if (isPrimaryAgent) {
                await this.prisma.chatRoom.update({
                    where: { id: roomId },
                    data: {
                        primaryAgentId: null,
                        assignedAt: null,
                    },
                });

                // Update Redis cache to remove primary agent
                await this.redis.hdel(`room:${roomId}:metadata`, 'primaryAgentId');

                this.logger.log(`Primary agent ${data.agentId} removed from room ${roomId}`, 'ChatAnalyticsProcessor');
            }

            // Update agent count in analytics
            await this.prisma.chatAnalytics.updateMany({
                where: { roomId },
                data: {
                    agentCount: { decrement: 1 },
                    participantCount: { decrement: 1 },
                },
            });

            // Create session history for agent leave
            // Get the ChatParticipant record to use its ID for session history
            const participant = await this.prisma.chatParticipant.findUnique({
                where: {
                    roomId_userId: {
                        roomId: roomId,
                        userId: data.agentId,
                    }
                },
                select: { id: true }
            });

            if (participant) {
                await this.prisma.chatSessionHistory.create({
                    data: {
                        roomId: roomId,
                        sessionType: 'agent_session',
                        participantId: participant.id, // Use ChatParticipant.id, not user ID
                        action: 'left',
                        reason: isPrimaryAgent ? 'primary_agent_removed' : 'agent_left',
                        startedAt: new Date(data.joinedAt || new Date()),
                        endedAt: new Date(data.leftAt || new Date()),
                        duration: data.leftAt && data.joinedAt
                            ? Math.round((new Date(data.leftAt).getTime() - new Date(data.joinedAt).getTime()) / 1000)
                            : null,
                    },
                });
            } else {
                this.logger.error(`ChatParticipant not found for agent ${data.agentId} in room ${roomId} - cannot create session history`, 'ChatAnalyticsProcessor');
            }

            this.logger.log(`Agent leave analytics updated for room ${roomId}${isPrimaryAgent ? ' (primary agent)' : ''}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process agent leave analytics error for room ${roomId}: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processChatEndAnalytics(roomId: string | null | undefined, data: any) {
        if (!roomId) {
            return;
        }

        // Calculate final analytics
        const room = await this.prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: { analytics: true },
        });

        if (room && room.analytics && room.startedAt) {
            const duration = room.endedAt ? room.endedAt.getTime() - room.startedAt.getTime() : 0;

            await this.prisma.chatAnalytics.update({
                where: { roomId },
                data: {
                    chatDuration: Math.floor(duration / 1000), // Convert to seconds
                    activeDuration: Math.floor(duration / 1000),
                },
            });
        }
    }

    private async processMessageDeliveryAnalytics(roomId: string | null | undefined, data: any) {
        // Track message delivery analytics for room-based delivery
        try {
            // Check if room exists before processing analytics
            if (!(await this.ensureRoomExists(roomId, 'message_delivery'))) {
                return;
            }

            if (!roomId) {
                return;
            }

            // Update message delivery status in database
            if (data.messageId) {
                await this.prisma.$transaction(async (tx) => {
                    const msg = await tx.chatMessage.findUnique({ where: { messageId: data.messageId } });
                    if (!msg) return;

                    const old = msg.deliveredTo || [];
                    const more = Array.isArray(data.deliveredTo)
                        ? data.deliveredTo
                        : [data.deliveredTo];
                    const merged = Array.from(new Set([...old, ...more]));

                    await tx.chatMessage.update({
                        where: { messageId: data.messageId },
                        data: {
                            deliveredTo: { set: merged },
                            deliveredAt: new Date(data.deliveredAt || new Date()),
                        },
                    });
                });
            } else {
                this.logger.log("Message ID is missing", 'ChatAnalyticsProcessor');
            }

            // Cache delivery analytics for the room
            await this.redis.setex(
                `room:${roomId}:delivery_stats`,
                3600,
                JSON.stringify({
                    lastDeliveryAt: data.deliveredAt,
                    messageId: data.messageId,
                    deliveredToRoom: true,
                    roomId: roomId,
                })
            );

            this.logger.log(`Message delivery analytics updated for room ${roomId} - message ${data.messageId} delivered to room`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process message delivery analytics error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processMessageReadAnalytics(roomId: string | null | undefined, data: any) {
        // Track message read analytics for multiple messages
        try {
            // Check if room exists before processing analytics
            if (!(await this.ensureRoomExists(roomId, 'message_read'))) {
                return;
            }

            if (!roomId) {
                return;
            }

            // Update multiple messages read status in database
            if (data.messageIds && Array.isArray(data.messageIds) && data.messageIds.length > 0) {
                await this.prisma.chatMessage.updateMany({
                    where: {
                        messageId: { in: data.messageIds },
                        roomId: roomId,
                        readAt: null, // Only update unread messages
                        senderType: {
                            in: ['visitor', 'agent']
                        }, // Exclude system messages
                    },
                    data: {
                        readAt: new Date(data.readAt || new Date()),
                        readBy: {
                            push: data.readerSocketId,
                        },
                    },
                });
            }

            // Get room and messages for analytics
            const room = await this.prisma.chatRoom.findUnique({
                where: { id: roomId },
                include: {
                    analytics: true,
                    messages: {
                        where: {
                            messageId: { in: data.messageIds || [] },
                            readAt: { not: null }, // Only get newly read messages
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });

            if (room && room.messages.length > 0) {
                // Calculate average read time for all messages
                const readTimes = room.messages.map(message => {
                    const readTime = data.readAt ? new Date(data.readAt).getTime() - message.createdAt.getTime() : 0;
                    return readTime;
                });

                const averageReadTime = readTimes.length > 0
                    ? readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length
                    : 0;

                // Cache read analytics
                await this.redis.setex(
                    `room:${roomId}:read_stats`,
                    3600,
                    JSON.stringify({
                        lastReadAt: data.readAt,
                        readerId: data.userId || data.sessionId || '',
                        readerType: data.readerType || 'unknown',
                        averageReadTime: averageReadTime,
                        messageCount: room.messages.length,
                        messageIds: data.messageIds,
                        markedCount: data.markedCount,
                    })
                );
            }

            this.logger.log(`Message read analytics updated for room ${roomId} - ${data.markedCount || 0} messages marked as read`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process message read analytics error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    // CRITICAL: Database persistence methods
    private async processRoomCreation(jobData: any) {
        try {
            const { roomData, participantData } = jobData;

            // Get the existing VisitorSession using the visitorSessionId from roomData
            const visitorSession = await this.prisma.visitorSession.findUnique({
                where: {
                    id: roomData.visitorSessionId
                }
            });

            if (!visitorSession) {
                throw new Error(`VisitorSession not found for session ID ${roomData.visitorSessionId}`);
            }

            // Create the chat room with proper foreign key relationships
            const room = await this.prisma.chatRoom.create({
                data: {
                    id: roomData.id,
                    workspaceId: roomData.workspaceId,
                    visitorSessionId: visitorSession.id, // Required field!
                    visitorId: roomData.visitorId,
                    currentServingDepartmentId: roomData.currentServingDepartmentId,
                    createdAt: new Date(roomData.createdAt),
                    lastActivityAt: new Date(roomData.lastActivityAt),
                },
            });

            // Create the participant (visitor)
            await this.prisma.chatParticipant.create({
                data: {
                    roomId: participantData.roomId,
                    visitorId: participantData.visitorId, // For visitors
                    userId: null, // For agents (null for visitors)
                    name: participantData.name,
                    role: participantData.role,
                    status: participantData.status,
                    joinedAt: new Date(participantData.joinedAt),
                },
            });

            this.logger.log(`Room ${roomData.id} successfully persisted to database`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process room creation error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error; // Let BullMQ handle retries
        }
    }

    private async processMessageCreation(jobData: any) {
        try {
            const { messageData, roomActivityUpdate } = jobData;

            // Create the message in the database
            await this.prisma.chatMessage.create({
                data: {
                    messageId: messageData.id,
                    roomId: messageData.roomId,
                    sessionId: messageData.sessionId,
                    userId: messageData.userId,
                    senderType: messageData.senderType,
                    content: messageData.content,
                    isInternal: messageData.isInternal,
                    messageType: messageData.messageType,
                    metadata: messageData.metadata || undefined,
                    createdAt: new Date(messageData.createdAt),
                },
            });

            // Update room's last activity
            if (roomActivityUpdate) {
                await this.prisma.chatRoom.update({
                    where: { id: roomActivityUpdate.roomId },
                    data: {
                        lastActivityAt: new Date(roomActivityUpdate.lastActivityAt),
                    },
                });
            }

            this.logger.log(`Message ${messageData.id} successfully persisted to database`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process message creation error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error; // Let BullMQ handle retries
        }
    }

    private async processAgentStatusUpdate(jobData: any) {
        try {
            const { agentId, workspaceId, statusData } = jobData;

            await this.prisma.agentStatus.upsert({
                where: { userId: agentId },
                update: {
                    status: statusData.status,
                    currentRoomId: statusData.currentRoomId,
                    statusChangedAt: new Date(),
                },
                create: {
                    userId: agentId,
                    workspaceId: workspaceId,
                    status: statusData.status || 'OFFLINE',
                    currentRoomId: statusData.currentRoomId,
                },
            });

            this.logger.log(`Agent ${agentId} status persisted to database`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process agent status update error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processAgentCapacityUpdate(jobData: any) {
        try {
            const { agentId, currentChats } = jobData;

            await this.prisma.agentStatus.update({
                where: { userId: agentId },
                data: { currentChats: currentChats },
            });

            this.logger.log(`Agent ${agentId} capacity updated to ${currentChats}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process agent capacity update error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processAgentEvent(jobData: any) {
        try {
            const { agentId, eventType, data } = jobData;

            // Process different agent events
            switch (eventType) {
                case 'status_updated':
                    // Update agent status in database
                    await this.prisma.agentStatus.update({
                        where: { userId: agentId },
                        data: {
                            status: data.newStatus,
                            statusChangedAt: new Date(),
                        },
                    });
                    this.logger.log(`Agent ${agentId} status event: ${data.newStatus}`, 'ChatAnalyticsProcessor');
                    break;
                case 'capacity_updated':
                    // Update agent capacity in database
                    await this.prisma.agentStatus.update({
                        where: { userId: agentId },
                        data: {
                            currentChats: data.newCapacity,
                        },
                    });
                    this.logger.log(`Agent ${agentId} capacity event: ${data.newCapacity}`, 'ChatAnalyticsProcessor');
                    break;
                case 'activity_logged':
                    // Log agent activity for analytics
                    this.logger.log(`Agent ${agentId} activity: ${data.activity}`, 'ChatAnalyticsProcessor');
                    break;
                default:
                    this.logger.log(`Agent ${agentId} event: ${eventType}`, 'ChatAnalyticsProcessor');
            }

            // Create session history for significant events
            if (['status_updated', 'capacity_updated'].includes(eventType)) {
                // Could create ChatSessionHistory records for agent events
                this.logger.log(`Agent event logged: ${agentId} - ${eventType}`, 'ChatAnalyticsProcessor');
            }
        } catch (error) {
            this.logger.error(`Process agent event error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processChatTransferAccepted(roomId: string | null | undefined, data: any) {
        try {
            if (!(await this.ensureRoomExists(roomId, 'chat_transfer_accepted'))) {
                return;
            }

            if (!roomId) {
                return;
            }

            const { fromAgentId, toAgentId, transferredAt, transferData, participantUpdates, analytics, sessionHistory } = data;

            // 1. UPDATE CHAT ROOM PRIMARY AGENT
            await this.prisma.chatRoom.update({
                where: { id: roomId },
                data: {
                    primaryAgentId: toAgentId,
                    assignedAt: new Date(transferredAt || new Date()),
                },
            });

            // 2. UPDATE REDIS CACHE WITH NEW PRIMARY AGENT
            await this.redis.hset(
                `room:${roomId}:metadata`,
                'primaryAgentId',
                toAgentId
            );
            await this.redis.expire(`room:${roomId}:metadata`, 86400); // 24 hours

            // 3. HANDLE PARTICIPANT UPDATES
            if (participantUpdates) {
                // Remove previous primary agent if they were still active
                if (participantUpdates.removeParticipant) {
                    const { roomId: pRoomId, userId, status, leftAt, reason } = participantUpdates.removeParticipant;

                    // Update existing participant status
                    await this.prisma.chatParticipant.update({
                        where: {
                            roomId_userId: {
                                roomId: pRoomId,
                                userId: userId,
                            }
                        },
                        data: {
                            status: status,
                            leftAt: new Date(leftAt || new Date()),
                        },
                    });

                    // Update agent capacity (decrement current chats)
                    const agentStatus = await this.prisma.agentStatus.findUnique({
                        where: { userId: userId },
                        select: { currentChats: true, currentRoomId: true }
                    });

                    if (agentStatus) {
                        const newCurrentChats = Math.max(0, agentStatus.currentChats - 1);
                        const newCurrentRoomId = agentStatus.currentRoomId === roomId ? null : agentStatus.currentRoomId;

                        if (newCurrentChats === 0) {
                            await this.prisma.agentStatus.update({
                                where: { userId: userId },
                                data: { status: 'ONLINE' },
                            });
                        }

                        await this.prisma.agentStatus.update({
                            where: { userId: userId },
                            data: {
                                currentChats: newCurrentChats,
                                currentRoomId: newCurrentRoomId,
                                lastSeenAt: new Date(),
                            },
                        });

                        this.logger.log(`Agent ${userId} capacity updated after transfer: ${newCurrentChats} current chats`, 'ChatAnalyticsProcessor');
                    }
                }

                // Add accepting agent as participant
                if (participantUpdates.addParticipant) {
                    const { roomId: pRoomId, userId, role, status, joinedAt, reason } = participantUpdates.addParticipant;

                    // Get agent details for participant creation
                    const agent = await this.prisma.user.findUnique({
                        where: { id: userId },
                        select: { name: true, email: true, avatarUrl: true }
                    });

                    if (agent) {
                        // Create or update participant
                        await this.prisma.chatParticipant.upsert({
                            where: {
                                roomId_userId: {
                                    roomId: pRoomId,
                                    userId: userId,
                                }
                            },
                            update: {
                                status: status,
                                leftAt: null, // Clear any previous leave timestamp
                                joinedAt: new Date(joinedAt || new Date()),
                            },
                            create: {
                                roomId: pRoomId,
                                userId: userId,
                                visitorId: null,
                                name: agent.name,
                                email: agent.email,
                                avatarUrl: agent.avatarUrl,
                                role: role,
                                status: status,
                                joinedAt: new Date(joinedAt || new Date()),
                            },
                        });
                    }

                    // Update agent capacity (increment current chats)
                    const acceptingAgentStatus = await this.prisma.agentStatus.findUnique({
                        where: { userId: userId },
                        select: { currentChats: true, maxConcurrentChats: true }
                    });

                    if (acceptingAgentStatus) {
                        const newCurrentChats = Math.min(acceptingAgentStatus.maxConcurrentChats, acceptingAgentStatus.currentChats + 1);

                        if (newCurrentChats === 1) {
                            await this.prisma.agentStatus.update({
                                where: { userId: userId },
                                data: { status: 'BUSY' },
                            });
                        }

                        await this.prisma.agentStatus.update({
                            where: { userId: userId },
                            data: {
                                currentChats: newCurrentChats,
                                currentRoomId: roomId,
                                lastSeenAt: new Date(),
                            },
                        });

                        this.logger.log(`Agent ${userId} capacity updated after transfer acceptance: ${newCurrentChats}/${acceptingAgentStatus.maxConcurrentChats}`, 'ChatAnalyticsProcessor');
                    }
                }
            }

            // 4. CREATE SESSION HISTORY
            if (sessionHistory && Array.isArray(sessionHistory)) {
                for (const session of sessionHistory) {
                    await this.prisma.chatSessionHistory.create({
                        data: {
                            roomId: roomId,
                            sessionType: session.sessionType,
                            participantId: session.participantId,
                            action: session.action,
                            reason: session.reason,
                            startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
                            endedAt: session.endedAt ? new Date(session.endedAt) : null,
                            duration: session.duration,
                        },
                    });
                }
            }

            // 5. UPDATE ANALYTICS
            await this.prisma.chatAnalytics.upsert({
                where: { roomId },
                update: {
                    // Keep existing counts, just update the transfer info
                    updatedAt: new Date(transferredAt || new Date()),
                },
                create: {
                    roomId,
                    messageCount: 0,
                    visitorMessageCount: 0,
                    agentMessageCount: 0,
                    internalMessageCount: 0,
                    createdAt: new Date(transferredAt || new Date()),
                    updatedAt: new Date(transferredAt || new Date()),
                },
            });

            // 6. CACHE TRANSFER ANALYTICS
            await this.redis.setex(
                `room:${roomId}:transfer_stats`,
                3600,
                JSON.stringify({
                    fromAgentId: fromAgentId,
                    toAgentId: toAgentId,
                    transferredAt: transferredAt,
                    transferReason: transferData?.transferReason || 'agent_transfer',
                    primaryAgentLeftBeforeTransfer: transferData?.primaryAgentLeftBeforeTransfer || false,
                })
            );

            const transferDescription = transferData?.primaryAgentLeftBeforeTransfer
                ? `transfer to available room: ${toAgentId} (primary agent already left)`
                : `transfer with primary agent removal: ${fromAgentId} -> ${toAgentId}`;

            this.logger.log(`Chat transfer accepted for room ${roomId}: ${transferDescription}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process chat transfer accepted error for room ${roomId}: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processChatInvitationAccepted(roomId: string | null | undefined, data: any) {
        try {
            if (!(await this.ensureRoomExists(roomId, 'chat_invitation_accepted'))) {
                return;
            }

            if (!roomId) {
                return;
            }

            const { agentId, joinedAt, invitationData, participantUpdates, analytics, sessionHistory } = data;

            // 1. HANDLE PARTICIPANT UPDATES (only add, no remove)
            if (participantUpdates && participantUpdates.addParticipant) {
                const { roomId: pRoomId, userId, role, status, joinedAt: participantJoinedAt, reason } = participantUpdates.addParticipant;

                // Get agent details for participant creation
                const agent = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, email: true, avatarUrl: true }
                });

                if (agent) {
                    // Create or update participant
                    await this.prisma.chatParticipant.upsert({
                        where: {
                            roomId_userId: {
                                roomId: pRoomId,
                                userId: userId,
                            }
                        },
                        update: {
                            status: status,
                            leftAt: null, // Clear any previous leave timestamp
                            joinedAt: new Date(participantJoinedAt || new Date()),
                        },
                        create: {
                            roomId: pRoomId,
                            userId: userId,
                            visitorId: null,
                            name: agent.name,
                            email: agent.email,
                            avatarUrl: agent.avatarUrl,
                            role: role,
                            status: status,
                            joinedAt: new Date(participantJoinedAt || new Date()),
                        },
                    });
                }

                // Update agent capacity (increment current chats)
                const acceptingAgentStatus = await this.prisma.agentStatus.findUnique({
                    where: { userId: userId },
                    select: { currentChats: true, maxConcurrentChats: true }
                });

                if (acceptingAgentStatus) {
                    const newCurrentChats = Math.min(acceptingAgentStatus.maxConcurrentChats, acceptingAgentStatus.currentChats + 1);

                    if (newCurrentChats === 1) {
                        await this.prisma.agentStatus.update({
                            where: { userId: userId },
                            data: { status: 'BUSY' },
                        });
                    }

                    await this.prisma.agentStatus.update({
                        where: { userId: userId },
                        data: {
                            currentChats: newCurrentChats,
                            currentRoomId: roomId,
                            lastSeenAt: new Date(),
                        },
                    });

                    this.logger.log(`Agent ${userId} capacity updated after invitation acceptance: ${newCurrentChats}/${acceptingAgentStatus.maxConcurrentChats}`, 'ChatAnalyticsProcessor');
                }
            }

            // 2. CREATE SESSION HISTORY
            if (sessionHistory && Array.isArray(sessionHistory)) {
                for (const session of sessionHistory) {
                    await this.prisma.chatSessionHistory.create({
                        data: {
                            roomId: roomId,
                            sessionType: session.sessionType,
                            participantId: session.participantId,
                            action: session.action,
                            reason: session.reason,
                            startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
                            endedAt: session.endedAt ? new Date(session.endedAt) : null,
                            duration: session.duration,
                        },
                    });
                }
            }

            // 3. UPDATE ANALYTICS
            await this.prisma.chatAnalytics.upsert({
                where: { roomId },
                update: {
                    agentCount: { increment: 1 },
                    participantCount: { increment: 1 },
                    updatedAt: new Date(joinedAt || new Date()),
                },
                create: {
                    roomId,
                    agentCount: 1,
                    participantCount: 1,
                    messageCount: 0,
                    visitorMessageCount: 0,
                    agentMessageCount: 0,
                    internalMessageCount: 0,
                    createdAt: new Date(joinedAt || new Date()),
                    updatedAt: new Date(joinedAt || new Date()),
                },
            });

            // 4. CACHE INVITATION ANALYTICS
            await this.redis.setex(
                `room:${roomId}:invitation_stats`,
                3600,
                JSON.stringify({
                    agentId: agentId,
                    joinedAt: joinedAt,
                    invitationReason: invitationData?.invitationReason || 'agent_invitation',
                    primaryAgentId: invitationData?.primaryAgentId || null,
                    primaryAgentName: invitationData?.primaryAgentName || 'Unknown',
                    isSecondaryAgent: invitationData?.isSecondaryAgent || true,
                })
            );

            this.logger.log(`Chat invitation accepted for room ${roomId}: Agent ${agentId} joined alongside primary agent ${invitationData?.primaryAgentId || 'None'}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process chat invitation accepted error for room ${roomId}: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processDepartmentTransfer(jobData: any) {
        try {
            const { roomId, workspaceId, fromDepartmentId, toDepartmentId, transferredAt, reason } = jobData.data;

            this.logger.log(`Processing department transfer: ${fromDepartmentId} -> ${toDepartmentId} for room ${roomId}`, 'ChatAnalyticsProcessor');

            // Ensure room exists
            if (!(await this.ensureRoomExists(roomId, 'department_transfer'))) {
                return;
            }

            // Get the department to add
            const toDepartment = await this.prisma.department.findFirst({
                where: {
                    id: toDepartmentId,
                    workspaceId: workspaceId,
                },
            });

            if (!toDepartment) {
                this.logger.warn(`Department ${toDepartmentId} not found for transfer to room ${roomId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Add department to chat room's departments list
            await this.prisma.chatRoom.update({
                where: {
                    id: roomId,
                    workspaceId: workspaceId,
                },
                data: {
                    departments: {
                        connect: {
                            id: toDepartmentId,
                        },
                    },
                    lastActivityAt: new Date(transferredAt),
                },
            });

            this.logger.log(`Department ${toDepartmentId} added to chat room ${roomId} departments list`, 'ChatAnalyticsProcessor');

        } catch (error) {
            this.logger.error(`Process department transfer error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processDepartmentTransferCancelled(jobData: any) {
        try {
            const { roomId, workspaceId, fromDepartmentId, toDepartmentId, cancelledAt, reason } = jobData.data;

            this.logger.log(`Processing department transfer cancellation: ${toDepartmentId} from room ${roomId}`, 'ChatAnalyticsProcessor');

            // Ensure room exists
            if (!(await this.ensureRoomExists(roomId, 'department_transfer_cancelled'))) {
                return;
            }

            // Get the department to remove
            const toDepartment = await this.prisma.department.findFirst({
                where: {
                    id: toDepartmentId,
                    workspaceId: workspaceId,
                },
            });

            if (!toDepartment) {
                this.logger.warn(`Department ${toDepartmentId} not found for cancellation from room ${roomId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Remove department from chat room's departments list
            await this.prisma.chatRoom.update({
                where: {
                    id: roomId,
                    workspaceId: workspaceId,
                },
                data: {
                    departments: {
                        disconnect: {
                            id: toDepartmentId,
                        },
                    },
                    lastActivityAt: new Date(cancelledAt),
                },
            });

            this.logger.log(`Department ${toDepartmentId} removed from chat room ${roomId} departments list`, 'ChatAnalyticsProcessor');

        } catch (error) {
            this.logger.error(`Process department transfer cancellation error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processDepartmentTransferAccepted(jobData: any) {
        try {
            const { roomId, workspaceId, fromDepartmentId, toDepartmentId, acceptedAt, reason } = jobData.data;

            this.logger.log(`Processing department transfer acceptance: ${fromDepartmentId} -> ${toDepartmentId} for room ${roomId}`, 'ChatAnalyticsProcessor');

            // Ensure room exists
            if (!(await this.ensureRoomExists(roomId, 'department_transfer_accepted'))) {
                return;
            }

            // Get the department to validate it exists
            const toDepartment = await this.prisma.department.findFirst({
                where: {
                    id: toDepartmentId,
                    workspaceId: workspaceId,
                },
            });

            if (!toDepartment) {
                this.logger.warn(`Department not found for transfer acceptance: from=${fromDepartmentId}, to=${toDepartmentId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Update chat room: set new current serving department and remove fromDepartment from departments list
            await this.prisma.chatRoom.update({
                where: {
                    id: roomId,
                    workspaceId: workspaceId,
                },
                data: {
                    currentServingDepartmentId: toDepartmentId,
                    departments: {
                        disconnect: {
                            id: toDepartmentId,
                        },
                    },
                    lastActivityAt: new Date(acceptedAt),
                },
            });

            this.logger.log(`Department transfer accepted: ${fromDepartmentId} -> ${toDepartmentId} for room ${roomId}`, 'ChatAnalyticsProcessor');

        } catch (error) {
            this.logger.error(`Process department transfer acceptance error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processDepartmentInvitation(jobData: any) {
        try {
            const { roomId, workspaceId, fromDepartmentId, toDepartmentId, invitedAt, reason } = jobData.data;

            this.logger.log(`Processing department invitation: ${fromDepartmentId} -> ${toDepartmentId} for room ${roomId}`, 'ChatAnalyticsProcessor');

            // Ensure room exists
            if (!(await this.ensureRoomExists(roomId, 'department_invitation'))) {
                return;
            }

            // Get the department to add
            const toDepartment = await this.prisma.department.findFirst({
                where: {
                    id: toDepartmentId,
                    workspaceId: workspaceId,
                },
            });

            if (!toDepartment) {
                this.logger.warn(`Department ${toDepartmentId} not found for invitation to room ${roomId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Add department to chat room's departments list
            await this.prisma.chatRoom.update({
                where: {
                    id: roomId,
                    workspaceId: workspaceId,
                },
                data: {
                    departments: {
                        connect: {
                            id: toDepartmentId,
                        },
                    },
                    lastActivityAt: new Date(invitedAt),
                },
            });

            this.logger.log(`Department ${toDepartmentId} invited to chat room ${roomId} departments list`, 'ChatAnalyticsProcessor');

        } catch (error) {
            this.logger.error(`Process department invitation error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processDepartmentInvitationAccepted(jobData: any) {
        try {
            const { roomId, workspaceId, agentId, currentDepartmentId, acceptedAt, invitationData, participantUpdates, analytics, sessionHistory } = jobData.data;

            this.logger.log(`Processing department invitation acceptance: ${agentId} for department ${currentDepartmentId} in room ${roomId}`, 'ChatAnalyticsProcessor');

            // Ensure room exists
            if (!(await this.ensureRoomExists(roomId, 'department_invitation_accepted'))) {
                return;
            }

            // 1. HANDLE PARTICIPANT UPDATES (only add, no remove)
            if (participantUpdates && participantUpdates.addParticipant) {
                const { roomId: pRoomId, userId, role, status, joinedAt: participantJoinedAt, reason } = participantUpdates.addParticipant;

                // Get agent details for participant creation
                const agent = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, email: true, avatarUrl: true }
                });

                if (agent) {
                    // Create or update participant
                    await this.prisma.chatParticipant.upsert({
                        where: {
                            roomId_userId: {
                                roomId: pRoomId,
                                userId: userId,
                            }
                        },
                        update: {
                            status: status,
                            leftAt: null, // Clear any previous leave timestamp
                            joinedAt: new Date(participantJoinedAt || new Date()),
                        },
                        create: {
                            roomId: pRoomId,
                            userId: userId,
                            visitorId: null,
                            name: agent.name,
                            email: agent.email,
                            avatarUrl: agent.avatarUrl,
                            role: role,
                            status: status,
                            joinedAt: new Date(participantJoinedAt || new Date()),
                        },
                    });
                }

                // Update agent capacity (increment current chats)
                const acceptingAgentStatus = await this.prisma.agentStatus.findUnique({
                    where: { userId: userId },
                    select: { currentChats: true, maxConcurrentChats: true }
                });

                if (acceptingAgentStatus) {
                    const newCurrentChats = Math.min(acceptingAgentStatus.maxConcurrentChats, acceptingAgentStatus.currentChats + 1);

                    if (newCurrentChats === 1) {
                        await this.prisma.agentStatus.update({
                            where: { userId: userId },
                            data: { status: 'BUSY' },
                        });
                    }

                    await this.prisma.agentStatus.update({
                        where: { userId: userId },
                        data: {
                            currentChats: newCurrentChats,
                            currentRoomId: roomId,
                            lastSeenAt: new Date(),
                        },
                    });

                    this.logger.log(`Agent ${userId} capacity updated after department invitation acceptance: ${newCurrentChats}/${acceptingAgentStatus.maxConcurrentChats}`, 'ChatAnalyticsProcessor');
                }
            }

            // 2. CREATE SESSION HISTORY
            if (sessionHistory && Array.isArray(sessionHistory)) {
                for (const session of sessionHistory) {
                    await this.prisma.chatSessionHistory.create({
                        data: {
                            roomId: roomId,
                            sessionType: session.sessionType,
                            participantId: session.participantId,
                            action: session.action,
                            reason: session.reason,
                            startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
                            endedAt: session.endedAt ? new Date(session.endedAt) : null,
                            duration: session.duration,
                        },
                    });
                }
            }

            // 3. UPDATE ANALYTICS
            await this.prisma.chatAnalytics.upsert({
                where: { roomId },
                update: {
                    agentCount: { increment: 1 },
                    participantCount: { increment: 1 },
                    updatedAt: new Date(acceptedAt || new Date()),
                },
                create: {
                    roomId,
                    agentCount: 1,
                    participantCount: 1,
                    messageCount: 0,
                    visitorMessageCount: 0,
                    agentMessageCount: 0,
                    internalMessageCount: 0,
                    createdAt: new Date(acceptedAt || new Date()),
                    updatedAt: new Date(acceptedAt || new Date()),
                },
            });

            // 4. CACHE DEPARTMENT INVITATION ANALYTICS
            await this.redis.setex(
                `room:${roomId}:department_invitation_stats`,
                3600,
                JSON.stringify({
                    agentId: agentId,
                    currentDepartmentId,
                    acceptedAt: acceptedAt,
                    invitationReason: invitationData?.invitationReason || 'department_invitation',
                    primaryAgentId: invitationData?.primaryAgentId || null,
                    primaryAgentName: invitationData?.primaryAgentName || 'Unknown',
                    isSecondaryAgent: invitationData?.isSecondaryAgent || true,
                })
            );

            this.logger.log(`Department invitation accepted for room ${roomId}: Agent ${agentId} joined for department ${currentDepartmentId} alongside primary agent ${invitationData?.primaryAgentId || 'None'}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process department invitation accepted error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processDepartmentInvitationRejected(jobData: any) {
        try {
            const { roomId, workspaceId, agentId, currentDepartmentId, rejectedAt, reason } = jobData.data;

            this.logger.log(`Processing department invitation rejection: ${agentId} for department ${currentDepartmentId} in room ${roomId}`, 'ChatAnalyticsProcessor');

            // Ensure room exists
            if (!(await this.ensureRoomExists(roomId, 'department_invitation_rejected'))) {
                return;
            }

            // Get the department to remove
            const currentDepartment = await this.prisma.department.findFirst({
                where: {
                    id: currentDepartmentId,
                    workspaceId: workspaceId,
                },
            });

            if (!currentDepartment) {
                this.logger.warn(`Department ${currentDepartmentId} not found for rejection from room ${roomId}`, 'ChatAnalyticsProcessor');
                return;
            }

            // Remove department from chat room's departments list
            await this.prisma.chatRoom.update({
                where: {
                    id: roomId,
                    workspaceId: workspaceId,
                },
                data: {
                    departments: {
                        disconnect: {
                            id: currentDepartmentId,
                        },
                    },
                    lastActivityAt: new Date(rejectedAt),
                },
            });

            // Cache department invitation rejection analytics
            await this.redis.setex(
                `room:${roomId}:department_invitation_rejection_stats`,
                3600,
                JSON.stringify({
                    agentId: agentId,
                    currentDepartmentId,
                    rejectedAt: rejectedAt,
                    rejectionReason: reason || 'department_invitation_rejected',
                    departmentName: currentDepartment.name,
                })
            );

            this.logger.log(`Department invitation rejected for room ${roomId}: Department ${currentDepartmentId} (${currentDepartment.name}) removed by agent ${agentId}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process department invitation rejected error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    // VISITOR-RELATED BACKGROUND PROCESSING METHODS
    private async processVisitorSessionCreated(jobData: any) {
        try {
            const { sessionData } = jobData;

            // First, ensure the Visitor record exists with identity fields
            await this.prisma.visitor.upsert({
                where: {
                    id: sessionData.visitorId,
                },
                update: {
                    // Identity fields (only update if provided)
                    ...(sessionData.visitorEmail && { email: sessionData.visitorEmail }),
                    ...(sessionData.visitorName && { name: sessionData.visitorName }),
                    ...(sessionData.visitorPhone && { phone: sessionData.visitorPhone }),
                    ...(sessionData.visitorNotes && { notes: sessionData.visitorNotes }),

                    // Aggregated metrics
                    isActive: true,
                    sessionCount: {
                        increment: 1
                    },
                    lastActivityAt: new Date(),
                },
                create: {
                    id: sessionData.visitorId,
                    workspaceId: sessionData.workspaceId,

                    // Identity fields
                    email: sessionData.visitorEmail,
                    name: sessionData.visitorName,
                    phone: sessionData.visitorPhone,
                    notes: sessionData.visitorNotes,

                    // Initial metrics
                    isActive: true,
                    sessionCount: 1,
                    lastActivityAt: new Date(),
                },
            });

            // Now create the visitor session with session-specific data
            try {
                await this.prisma.visitorSession.create({
                    data: {
                        id: sessionData.id,
                        visitorId: sessionData.visitorId,
                        workspaceId: sessionData.workspaceId,

                        // Session context fields
                        userAgent: sessionData.userAgent,
                        ipAddress: sessionData.ipAddress,
                        deviceInfo: sessionData.deviceInfo,
                        deviceFingerprint: sessionData.deviceFingerprint,
                        hostName: sessionData.hostName,
                        location: sessionData.location,
                        referrerData: sessionData.referrerData,

                        // Session state
                        status: sessionData.status,
                        startedAt: new Date(sessionData.startedAt),
                        endedAt: sessionData.endedAt ? new Date(sessionData.endedAt) : null,
                        lastActivityAt: new Date(sessionData.lastActivityAt),
                    },
                });

                // Create page tracking record if page tracking data is provided
                if (sessionData.pageTracking) {
                    const now = new Date();
                    try {
                        await this.prisma.visitorPageTracking.create({
                            data: {
                                visitorId: sessionData.visitorId,
                                sessionId: sessionData.id,
                                workspaceId: sessionData.workspaceId,

                                // Page identification
                                pageUrl: sessionData.pageTracking.pageUrl,
                                pageTitle: sessionData.pageTracking.pageTitle,
                                pagePath: sessionData.pageTracking.pagePath,
                                pageHash: sessionData.pageTracking.pageHash,
                                pageQuery: sessionData.pageTracking.pageQuery,

                                // Engagement metrics
                                timeOnPage: sessionData.pageTracking.timeOnPage,
                                pageLoadTime: sessionData.pageTracking.pageLoadTime,

                                // Navigation context
                                navigationMethod: sessionData.pageTracking.navigationMethod,
                                navigationSource: sessionData.pageTracking.navigationSource,
                                navigationIntent: sessionData.pageTracking.navigationIntent,

                                // Navigation path
                                navigationPath: [{
                                    pageUrl: sessionData.pageTracking.pageUrl,
                                    pageTitle: sessionData.pageTracking.pageTitle,
                                    pagePath: sessionData.pageTracking.pagePath,
                                    pageHash: sessionData.pageTracking.pageHash,
                                    pageQuery: sessionData.pageTracking.pageQuery,
                                    timeOnPage: sessionData.pageTracking.timeOnPage,
                                    pageLoadTime: sessionData.pageTracking.pageLoadTime,
                                    navigationMethod: sessionData.pageTracking.navigationMethod,
                                    navigationSource: sessionData.pageTracking.navigationSource,
                                    navigationIntent: sessionData.pageTracking.navigationIntent,
                                    viewedAt: now.toISOString(),
                                    updatedAt: now.toISOString(),
                                }],

                                // Timing
                                viewedAt: now.toISOString(),
                                updatedAt: now.toISOString(),
                            },
                        });

                        this.logger.log(`Page tracking record created for session ${sessionData.id}`, 'ChatAnalyticsProcessor');
                    } catch (pageTrackingError) {
                        this.logger.error(`Error creating page tracking record: ${pageTrackingError.message}`, 'ChatAnalyticsProcessor');
                        // Don't throw error for page tracking - session creation is more important
                    }
                }
            } catch (error) {
                this.logger.error(`Error creating visitor session: ${error.message}`, 'ChatAnalyticsProcessor');
                throw error;
            }

            this.logger.log(`Visitor session ${sessionData.id} persisted to database`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process visitor session created error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processVisitorSessionEnded(jobData: any) {
        try {
            const { sessionId, visitorId, workspaceId, endedAt, duration } = jobData;

            // Update visitor session with end information
            // Use sessionId if available, otherwise use visitorId + workspaceId combination
            const updateWhere = sessionId
                ? { id: sessionId }
                : {
                    visitorId: visitorId,
                    workspaceId: workspaceId,
                    status: 'ACTIVE' as const
                };

            await this.prisma.visitorSession.updateMany({
                where: updateWhere,
                data: {
                    status: 'AWAY',
                    endedAt: new Date(endedAt),
                    lastActivityAt: new Date(endedAt),
                },
            });

            this.logger.log(`Visitor session ${sessionId || `${visitorId}:${workspaceId}`} ended in database`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process visitor session ended error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processVisitorActivityTracked(jobData: any) {
        try {
            const { visitorId, activityData, timestamp } = jobData;

            // Update visitor session with latest activity
            await this.prisma.visitorSession.updateMany({
                where: {
                    visitorId: visitorId,
                    status: 'ACTIVE',
                },
                data: {
                    lastActivityAt: new Date(timestamp),
                },
            });

            // Note: Activity logging could be enhanced to store in a separate ActivityLog table
            this.logger.log(`Visitor activity tracked for ${visitorId}: ${activityData.activity_type}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process visitor activity tracked error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processVisitorInfoUpdated(jobData: any) {
        try {
            const { visitorId, workspaceId, visitorData, timestamp } = jobData;

            // Create or update visitor record
            await this.prisma.visitor.upsert({
                where: {
                    id: visitorId, // Use the visitorId as the primary key
                },
                update: {
                    name: visitorData.name,
                    email: visitorData.email,
                    phone: visitorData.phone,
                    notes: visitorData.notes,
                    lastActivityAt: new Date(timestamp),
                },
                create: {
                    id: visitorId, // Use the visitorId as the Visitor record ID
                    workspaceId: workspaceId,
                    email: visitorData.email,
                    name: visitorData.name,
                    phone: visitorData.phone,
                    notes: visitorData.notes,
                    lastActivityAt: new Date(timestamp),
                },
            });

            this.logger.log(`Visitor info updated for ${visitorId}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process visitor info updated error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processVisitorSessionContextUpdated(jobData: any) {
        try {
            const { visitorId, workspaceId, contextData, timestamp } = jobData;

            // Update visitor session context
            await this.prisma.visitorSession.updateMany({
                where: {
                    visitorId: visitorId,
                    workspaceId: workspaceId,
                },
                data: {
                    referrerData: contextData.referrerData,
                    userAgent: contextData.userAgent,
                    ipAddress: contextData.ipAddress,
                    lastActivityAt: new Date(timestamp),
                },
            });

            this.logger.log(`Visitor session context updated for ${visitorId}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process visitor session context updated error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processVisitorSessionStatusUpdated(jobData: any) {
        try {
            const { visitorId, status, timestamp } = jobData;

            // Update visitor session status
            await this.prisma.visitorSession.updateMany({
                where: {
                    visitorId: visitorId,
                },
                data: {
                    status: status,
                    endedAt: status === 'closed' ? new Date(timestamp) : null,
                    lastActivityAt: new Date(timestamp),
                },
            });

            this.logger.log(`Visitor session status updated for ${visitorId} to ${status}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process visitor session status updated error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processVisitorAnalyticsUpdated(jobData: any) {
        try {
            const { visitorId, workspaceId, analyticsData, timestamp } = jobData;

            // Update visitor analytics
            await this.prisma.visitorAnalytics.upsert({
                where: {
                    visitorId_workspaceId: {
                        visitorId: visitorId,
                        workspaceId: workspaceId,
                    },
                },
                update: {
                    totalChats: { increment: analyticsData.totalChats || 0 },
                    totalMessages: { increment: analyticsData.totalMessages || 0 },
                    averageChatDuration: analyticsData.averageChatDuration,
                    averageRating: analyticsData.averageRating,
                    totalRatings: { increment: analyticsData.totalRatings || 0 },
                    lastVisitAt: new Date(timestamp),
                    updatedAt: new Date(timestamp),
                },
                create: {
                    visitorId: visitorId,
                    workspaceId: workspaceId,
                    totalChats: analyticsData.totalChats || 0,
                    totalMessages: analyticsData.totalMessages || 0,
                    averageChatDuration: analyticsData.averageChatDuration,
                    averageRating: analyticsData.averageRating,
                    totalRatings: analyticsData.totalRatings || 0,
                    firstVisitAt: new Date(timestamp),
                    lastVisitAt: new Date(timestamp),
                    updatedAt: new Date(timestamp),
                },
            });

            this.logger.log(`Visitor analytics updated for ${visitorId}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process visitor analytics updated error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async processTypingEvent(jobData: any) {
        try {
            const { roomId, participantId, isTyping, timestamp, typingEvent } = jobData;

            // Check if room exists before processing typing event
            if (!(await this.ensureRoomExists(roomId, 'typing_event'))) {
                return;
            }

            if (isTyping) {
                // Check if typing event already exists
                const existingTypingEvent = await this.prisma.typingEvent.findFirst({
                    where: {
                        roomId: roomId,
                        participantId: participantId,
                    },
                });

                if (existingTypingEvent) {
                    // Update existing typing event
                    await this.prisma.typingEvent.update({
                        where: { id: existingTypingEvent.id },
                        data: {
                            isTyping: true,
                            expiresAt: new Date(typingEvent.expiresAt),
                        },
                    });
                } else {
                    // Create new typing event
                    await this.prisma.typingEvent.create({
                        data: {
                            roomId: roomId,
                            participantId: participantId,
                            isTyping: true,
                            createdAt: new Date(typingEvent.createdAt),
                            expiresAt: new Date(typingEvent.expiresAt),
                        },
                    });
                }
            } else {
                // Remove typing event when user stops typing
                await this.prisma.typingEvent.deleteMany({
                    where: {
                        roomId: roomId,
                        participantId: participantId,
                    },
                });
            }

            this.logger.log(`Typing event processed: ${participantId} in room ${roomId} - ${isTyping ? 'started' : 'stopped'} typing`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process typing event error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    // ============================================================================
    // CHAT ANALYTICS CALCULATIONS
    // ============================================================================

    private async calculateFirstResponseTime(jobData: any) {
        try {
            const { roomId, messageId, timestamp, agentId } = jobData;

            // Check if this is the first agent message in the room
            const messageCount = await this.prisma.chatMessage.count({
                where: {
                    roomId: roomId,
                    senderType: 'agent',
                    id: { not: messageId }, // Exclude current message
                },
            });

            // Only calculate if this is the first agent response
            if (messageCount === 0) {
                // Get the first visitor message timestamp
                const firstVisitorMessage = await this.prisma.chatMessage.findFirst({
                    where: {
                        roomId: roomId,
                        senderType: 'visitor',
                    },
                    orderBy: { createdAt: 'asc' },
                });

                if (firstVisitorMessage) {
                    const responseTime = new Date(timestamp).getTime() - firstVisitorMessage.createdAt.getTime();

                    // Update ChatAnalytics with first response time
                    await this.prisma.chatAnalytics.upsert({
                        where: { roomId: roomId },
                        update: {
                            firstResponseTime: responseTime,
                            updatedAt: new Date(timestamp),
                        },
                        create: {
                            roomId: roomId,
                            firstResponseTime: responseTime,
                            messageCount: 1,
                            agentMessageCount: 1,
                            createdAt: new Date(timestamp),
                            updatedAt: new Date(timestamp),
                        },
                    });

                    this.logger.log(`First response time calculated for room ${roomId}: ${responseTime}ms`, 'ChatAnalyticsProcessor');
                }
            }
        } catch (error) {
            this.logger.error(`Calculate first response time error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async calculateAverageResponseTime(jobData: any) {
        try {
            const { roomId, messageId, timestamp, agentId } = jobData;

            // Get the previous visitor message to calculate response time
            const previousVisitorMessage = await this.prisma.chatMessage.findFirst({
                where: {
                    roomId: roomId,
                    senderType: 'visitor',
                    createdAt: { lt: new Date(timestamp) },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (previousVisitorMessage) {
                const responseTime = new Date(timestamp).getTime() - previousVisitorMessage.createdAt.getTime();

                // Get current analytics to calculate new average
                const currentAnalytics = await this.prisma.chatAnalytics.findUnique({
                    where: { roomId: roomId },
                });

                if (currentAnalytics) {
                    const currentAvg = currentAnalytics.averageResponseTime || 0;
                    const currentCount = currentAnalytics.agentMessageCount || 0;

                    // Calculate new average: ((old_avg * old_count) + new_time) / (old_count + 1)
                    const newAverage = currentCount > 0
                        ? Math.round(((currentAvg * currentCount) + responseTime) / (currentCount + 1))
                        : responseTime;

                    await this.prisma.chatAnalytics.update({
                        where: { roomId: roomId },
                        data: {
                            averageResponseTime: newAverage,
                            updatedAt: new Date(timestamp),
                        },
                    });

                    this.logger.log(`Average response time updated for room ${roomId}: ${newAverage}ms`, 'ChatAnalyticsProcessor');
                }
            }
        } catch (error) {
            this.logger.error(`Calculate average response time error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    private async calculateChatDuration(jobData: any) {
        try {
            const { roomId, timestamp, isActive = true } = jobData;

            // Get the chat room creation time
            const chatRoom = await this.prisma.chatRoom.findUnique({
                where: { id: roomId },
                select: { createdAt: true, startedAt: true, endedAt: true },
            });

            if (chatRoom) {
                const startTime = chatRoom.startedAt || chatRoom.createdAt;
                const endTime = isActive ? new Date(timestamp) : (chatRoom.endedAt || new Date(timestamp));
                const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // in seconds

                // Calculate active duration (time with messages)
                const firstMessage = await this.prisma.chatMessage.findFirst({
                    where: { roomId: roomId },
                    orderBy: { createdAt: 'asc' },
                });

                const lastMessage = await this.prisma.chatMessage.findFirst({
                    where: { roomId: roomId },
                    orderBy: { createdAt: 'desc' },
                });

                let activeDuration = 0;
                if (firstMessage && lastMessage) {
                    activeDuration = Math.round((lastMessage.createdAt.getTime() - firstMessage.createdAt.getTime()) / 1000);
                }

                await this.prisma.chatAnalytics.upsert({
                    where: { roomId: roomId },
                    update: {
                        chatDuration: duration,
                        activeDuration: activeDuration,
                        updatedAt: new Date(timestamp),
                    },
                    create: {
                        roomId: roomId,
                        chatDuration: duration,
                        activeDuration: activeDuration,
                        messageCount: 0,
                        createdAt: new Date(timestamp),
                        updatedAt: new Date(timestamp),
                    },
                });

                this.logger.log(`Chat duration calculated for room ${roomId}: ${duration}s (active: ${activeDuration}s)`, 'ChatAnalyticsProcessor');
            }
        } catch (error) {
            this.logger.error(`Calculate chat duration error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    // ============================================================================
    // SESSION HISTORY TRACKING
    // ============================================================================

    private async processChatSessionHistory(jobData: any) {
        try {
            const { roomId, sessionType, participantId, action, reason, startedAt, endedAt, duration, timestamp } = jobData;

            await this.prisma.chatSessionHistory.create({
                data: {
                    roomId: roomId,
                    sessionType: sessionType, // visitor_session, agent_session
                    participantId: participantId,
                    action: action, // joined, left, transferred, escalated
                    reason: reason,
                    startedAt: new Date(startedAt),
                    endedAt: endedAt ? new Date(endedAt) : null,
                    duration: duration, // seconds
                },
            });

            this.logger.log(`Session history created for room ${roomId}: ${participantId} ${action}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process chat session history error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }

    // ============================================================================
    // PERFORMANCE METRICS
    // ============================================================================

    private async processChatPerformanceMetric(jobData: any) {
        try {
            const { workspaceId, metricType, metricName, value, unit, timePeriod, agentId, roomId, timestamp } = jobData;

            await this.prisma.chatPerformanceMetric.create({
                data: {
                    workspaceId: workspaceId,
                    metricType: metricType, // response_time, satisfaction, volume, etc.
                    metricName: metricName,
                    value: value,
                    unit: unit || 'ms',
                    timePeriod: timePeriod, // daily, weekly, monthly
                    agentId: agentId,
                    roomId: roomId,
                    recordedAt: new Date(timestamp),
                },
            });

            this.logger.log(`Performance metric recorded: ${metricType}/${metricName} = ${value}${unit}`, 'ChatAnalyticsProcessor');
        } catch (error) {
            this.logger.error(`Process chat performance metric error: ${error.message}`, 'ChatAnalyticsProcessor');
            throw error;
        }
    }
} 