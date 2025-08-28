import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './services/chat.service';
import { VisitorService } from './services/visitor.service';
import { AgentService } from './services/agent.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { UsersService } from '../users/users.service';
import { Redis } from 'ioredis';
import { Inject } from '@nestjs/common';
import { ClientMessage, ChatError, ClientTyping, AgentRoom, TransferChatToAgent, ConnectionData, ChatTransferAcceptOrReject, InviteAgentToChat, ChatInvitationAcceptOrReject, TransferChatToDepartment, ChatTransferToDepartmentAcceptOrReject, InviteDepartmentToChat, DepartmentInvitationAcceptOrReject, SystemMessage, VisitorPageChanged, FileMessage, MessageReadOrDeliveredRequest, AgentRoomClose, FileUploadStatus, VisitorPastChats, AgentChatTag, VisitorChatTag, CannedResponseUsage, VisitorIdentity, VisitorPostChatForm, MessageHistory } from './types/chat-types';
import { DepartmentsService } from 'src/departments/services/departments.service';
import { MessageTrackingService, TrackedMessage } from './services/message-tracking.service';
import { AgentStatus, ConnectionTrackingService, SessionStatus } from './services/connection-tracking.service';
import { randomUUID } from 'crypto';
import { TagsService } from 'src/tags/tags.service';
import { CannedResponsesService } from 'src/canned-responses/canned-responses.service';
import { TriggersJobData } from 'src/triggers/queues/triggers.queue';
import { JobsOptions, Queue } from 'bullmq';
import { TriggerEvent } from '@prisma/client';

@WebSocketGateway({
    cors: {
        origin: [
            'https://widget-mediater.autobotx.ai',
            'http://localhost:3001',
            'http://localhost:3000',
            '*'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 5e6,
    allowEIO3: true,
    // Enterprise security settings
    allowRequest: (req, callback) => {
        // Rate limiting check
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // Additional security checks can be added here
        callback(null, true);
    },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly GRACE_PERIOD_FOR_CONNECTION_REMOVAL = 15000; // 15 seconds

    // Connection monitoring and health checks
    private connectionStats = {
        totalConnections: 0,
        activeConnections: 0,
        failedConnections: 0,
        lastHealthCheck: Date.now(),
    };

    // Health check interval
    private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

    constructor(
        private readonly chatService: ChatService,
        private readonly visitorService: VisitorService,
        private readonly agentService: AgentService,
        private readonly messageTrackingService: MessageTrackingService,
        private readonly connectionTrackingService: ConnectionTrackingService,
        private readonly logger: AppLoggerService,
        private readonly jwtService: JwtService,
        private readonly workspaceService: WorkspaceService,
        private readonly departmentService: DepartmentsService,
        private readonly usersService: UsersService,
        private readonly tagService: TagsService,
        private readonly cannedResponseService: CannedResponsesService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('TRIGGERS_QUEUE') private readonly triggersQueue: Queue<TriggersJobData>,
    ) { }

    afterInit(server: Server) {
        this.logger.log(`Chat WebSocket Gateway initialized on shared server`, 'ChatGateway');

        // Set up health checks
        setInterval(() => {
            this.performHealthCheck();
        }, this.HEALTH_CHECK_INTERVAL);
    }

    // ===========================================================
    // PUBLIC HELPER METHODS
    // ===========================================================

    async broadcastSystemMessage(
        workspaceId: string,
        roomId: string,
        messageId: string,
        content: string,
        senderName: string,
        sentAt: Date
    ) {

        await this.chatService.createMessage(
            messageId,
            roomId,
            'triggered-message',
            content,
            false,
            undefined,
            undefined,
            workspaceId,
            {
                senderName: senderName,
            }
        )

        this.server.to(`room:${roomId}`).emit('new-message', {
            messageId: messageId,
            roomId: roomId,
            content: content,
            senderType: 'triggered-message',
            senderName: senderName,
            sentAt: sentAt,
            workspaceId: workspaceId,
        });

        this.server.to(`room_view:${roomId}`).emit('new-message', {
            messageId: messageId,
            roomId: roomId,
            content: content,
            senderType: 'triggered-message',
            senderName: senderName,
            sentAt: sentAt,
            workspaceId: workspaceId,
        });
    }

    async updateVisitorQueuesForWorkspace(workspaceId: string, departmentId?: string) {

        const queues = await this.visitorService.getActiveVisitorsInWorkspace(workspaceId, departmentId);

        if (departmentId) {
            console.log("Emitting to Department: ", departmentId, "Queues: ", queues);
            this.server.to(`workspace:${workspaceId}:${departmentId}`).emit('visitor-queues', {
                active: queues.active,
                idle: queues.idle,
                incoming: queues.incoming,
                currentlyServed: queues.currentlyServed,
                pendingTransfer: queues.pendingTransfer,
                pendingInvite: queues.pendingInvite,
            });
        } else {
            console.log("Emitting to Workspace: ", workspaceId, "Queues: ", queues);

            this.server.to(`workspace:${workspaceId}`).emit('visitor-queues', {
                active: queues.active,
                idle: queues.idle,
                incoming: queues.incoming,
                currentlyServed: queues.currentlyServed,
                pendingTransfer: queues.pendingTransfer,
                pendingInvite: queues.pendingInvite,
            });
        }
    }

    // ===========================================================
    // PRIVATE HELPER METHODS
    // ===========================================================

    private async enqueueEvent(
        workspaceId: string,
        eventType: TriggerEvent,
        payload: Record<string, any>,
        options?: JobsOptions
    ): Promise<void> {
        await this.triggersQueue.add(
            'trigger_event',
            {
                type: 'trigger_event',
                workspaceId,
                eventType,
                payload,
            },
            {
                removeOnComplete: true,
                removeOnFail: 50,
                attempts: options?.attempts ?? 3,
                backoff: options?.backoff ?? { type: 'exponential', delay: 2000 },
            }
        );
    }

    private extractConnectionData(client: Socket) {
        const authData = client.handshake.auth;
        const queryData = client.handshake.query;

        const connectionData = {
            visitorId: authData.visitorId || queryData.visitorId,
            agentId: authData.agentId || queryData.agentId,
            token: authData.token || queryData.token,
            workspaceId: authData.workspaceId || queryData.workspaceId,
            sessionId: authData.sessionId || queryData.sessionId,
            currentDepartmentId: authData.currentDepartmentId || queryData.currentDepartmentId,
        } as ConnectionData;

        return connectionData;
    }

    private validateConnectionData(data: ConnectionData): boolean {

        if (data.sessionId) {
            const isValid = !!(data.sessionId && data.workspaceId && data.visitorId && typeof data.visitorId === 'string' && data.visitorId.length >= 3);
            return isValid;
        }

        if (data.token) {
            return true;
        }

        this.logger.error(`Connection validation failed: missing visitorId or agentId`, 'ChatGateway');
        return false;
    }

    private async validateVisitorSessionWithSecurity(sessionId: string, visitorId: string, workspaceId: string, clientIp: string): Promise<boolean> {
        try {
            // Validate session
            const isValid = await this.visitorService.validateVisitorSession(sessionId, visitorId, workspaceId);

            this.logger.log(`Session validation result: ${isValid} for sessionId: ${sessionId}`, 'ChatGateway');

            if (!isValid) {
                this.logger.error(`Session validation failed for sessionId: ${sessionId}, visitorId: ${visitorId}, workspaceId: ${workspaceId}`, 'ChatGateway');
                return false;
            }

            // Log successful validation
            this.logger.log(`Session validation successful for ${visitorId} from IP ${clientIp}`, 'ChatGateway');
            return true;

        } catch (error) {
            this.logger.error(`Session validation error: ${error.message}`, 'ChatGateway');
            return false;
        }
    }

    private async performHealthCheck() {
        try {
            const now = Date.now();
            const uptime = now - this.connectionStats.lastHealthCheck;

            // Log health metrics
            this.logger.log(`Health Check - Active: ${this.connectionStats.activeConnections}, Total: ${this.connectionStats.totalConnections}, Failed: ${this.connectionStats.failedConnections}, Uptime: ${uptime}ms`, 'ChatGateway');

            // Reset counters
            this.connectionStats.lastHealthCheck = now;

            // Check Redis connectivity
            await this.redis.ping();

        } catch (error) {
            this.logger.error(`Health check failed: ${error.message}`, 'ChatGateway');
        }
    }

    private sendErrorResponse(client: Socket, errorType: ChatError['type'], message: string, code: string, details?: any) {
        const errorResponse: ChatError = {
            type: errorType,
            message,
            code,
            timestamp: new Date(),
            details
        };
        client.emit('error', errorResponse);
        this.logger.error(`${errorType}: ${message}`, 'ChatGateway');
    }

    private async updateVisitorQueuesForClient(client: Socket, workspaceId: string, departmentId?: string): Promise<void> {
        try {
            const { agentId, user } = client.data as ConnectionData;

            if (agentId && user.userDepartments && user.userDepartments.length > 0 && !departmentId) {
                // Agent has multiple departments and no specific department - use multi-department method
                const departmentIds = user.userDepartments.map(dept => dept.departmentId);
                const queues = await this.visitorService.getActiveVisitorsForMultipleDepartments(workspaceId, departmentIds);

                console.log("Agent Emitting Queues: ", queues);

                // Emit to all department rooms the agent belongs to
                for (const dept of user.userDepartments) {
                    this.server.to(`workspace:${workspaceId}:${dept.departmentId}`).emit('visitor-queues', {
                        active: queues.active,
                        idle: queues.idle,
                        incoming: queues.incoming,
                        currentlyServed: queues.currentlyServed,
                        pendingTransfer: queues.pendingTransfer,
                        pendingInvite: queues.pendingInvite,
                    });
                }
            } else {
                // Single department or specific department update
                const targetDepartmentId = departmentId || client.data.currentDepartmentId;
                const queues = await this.visitorService.getActiveVisitorsInWorkspace(workspaceId, targetDepartmentId);

                if (targetDepartmentId) {
                    console.log("Emitting to Department: ", targetDepartmentId, "Queues: ", queues);
                    this.server.to(`workspace:${workspaceId}:${targetDepartmentId}`).emit('visitor-queues', {
                        active: queues.active,
                        idle: queues.idle,
                        incoming: queues.incoming,
                        currentlyServed: queues.currentlyServed,
                        pendingTransfer: queues.pendingTransfer,
                        pendingInvite: queues.pendingInvite,
                    });
                } else {
                    console.log("Emitting to Workspace: ", workspaceId, "Queues: ", queues);

                    this.server.to(`workspace:${workspaceId}`).emit('visitor-queues', {
                        active: queues.active,
                        idle: queues.idle,
                        incoming: queues.incoming,
                        currentlyServed: queues.currentlyServed,
                        pendingTransfer: queues.pendingTransfer,
                        pendingInvite: queues.pendingInvite,
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Error updating visitor queues: ${error.message}`, 'ChatGateway');
        }
    }

    private async handleVisitorConnection(client: Socket, data: ConnectionData, clientIp: string) {

        const { visitorId, workspaceId, sessionId, currentDepartmentId } = data;

        if (!visitorId || !workspaceId || !sessionId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'visitorId, workspaceId, and sessionId are required',
                'INVALID_VISITOR_ID_OR_WORKSPACE_ID_OR_SESSION_ID',
                { visitorId, workspaceId, sessionId }
            );
            client.disconnect(true);
            return;
        }

        // Check if the visitor is reconnecting within grace period, so maintain their original status
        const isReconnecting = await this.redis.get(`visitor:${visitorId}:${sessionId}`);
        let previousStatus: SessionStatus | null = null;
        if (isReconnecting) {
            await this.redis.del(`visitor:${visitorId}:${sessionId}`);
            previousStatus = JSON.parse(isReconnecting).previousStatus;
        }

        try {
            // Validate workspace exists
            const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
            if (!workspace) {
                this.logger.error(`Visitor connection rejected: Invalid workspace ${workspaceId} from IP ${clientIp}`, 'ChatGateway');
                client.disconnect(true);
                return;
            }

            if (currentDepartmentId) {
                // Validate department exists
                const department = await this.departmentService.getDepartmentById(currentDepartmentId, workspaceId);
                if (!department) {
                    this.logger.error(`Visitor connection rejected: Invalid department ${currentDepartmentId} from IP ${clientIp}`, 'ChatGateway');
                    client.disconnect(true);
                    return;
                }
            }

            // Validate visitor session with enhanced security
            const isValidSession = await this.validateVisitorSessionWithSecurity(sessionId, visitorId, workspaceId, clientIp);
            if (!isValidSession) {
                this.logger.error(`Visitor connection rejected: Invalid session from IP ${clientIp}`, 'ChatGateway');
                client.disconnect(true);
                return;
            }

            // Add connection (service handles connection limit and status logic internally)
            const connectionData = await this.connectionTrackingService.addConnection(sessionId, client.id, 'visitor', workspaceId, visitorId);

            // Create chat room for visitor
            const chatRoom = await this.chatService.createChatRoom(visitorId, workspaceId, sessionId, currentDepartmentId);

            // Update visitor service status if this is a new session or if status changed to ACTIVE
            if (connectionData.status === SessionStatus.ACTIVE && !previousStatus) {
                await this.visitorService.updateSessionStatus(sessionId, connectionData.status);
            } else if (previousStatus) {
                const status = previousStatus !== SessionStatus.IDLE ? previousStatus : SessionStatus.ACTIVE;
                await this.visitorService.updateSessionStatus(sessionId, status);
                await this.connectionTrackingService.updateSessionStatus(sessionId, status);
            }

            // Join the created chat room
            await client.join(`room:${chatRoom.id}`);

            if (!isReconnecting) {
                // Create a system message for visitor connection
                await this.chatService.createMessage(
                    randomUUID(),
                    chatRoom.id,
                    'visitor-system',
                    `${chatRoom.visitor?.name || "Visitor"} has joined the chat`,
                    false,
                    undefined,
                    undefined,
                    workspaceId,
                );

                this.server.to(`room_view:${chatRoom.id}`).emit('visitor-connected', {
                    roomId: chatRoom.id,
                    participantId: visitorId,
                    participantType: 'visitor',
                    participantName: chatRoom.visitor?.name,
                    connectedAt: new Date(),
                });

                // Enqueue event for trigger evaluation
                await this.enqueueEvent(
                    workspaceId,
                    TriggerEvent.WIDGET_ENTER,
                    {
                        visitorId,
                        sessionId,
                        chatRoom,
                        departmentId: currentDepartmentId,
                        clientIp,
                        visitorStatus: connectionData.status,
                    }
                );
            }

            // Notify agents with enhanced data
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

            // Store connection info
            client.data.authenticated = true;
            client.data.userType = 'visitor';
            client.data.roomId = chatRoom.id;
            client.data.sessionId = sessionId;
            client.data.visitorId = visitorId;
            client.data.workspaceId = workspaceId;
            client.data.currentDepartmentId = currentDepartmentId;
            client.data.visitor = chatRoom.visitor || null;
            client.data.clientIp = clientIp;

            // Notify the visitor that they have been connected to the chat room
            client.emit('visitor-connected', {
                visitorId: visitorId,
                sessionId: sessionId,
                visitorName: chatRoom.visitor?.name,
                workspaceId: workspaceId,
                departmentId: currentDepartmentId,
                roomId: chatRoom.id,
                connectedAt: new Date(),
            });

            // Send message history if available
            if (chatRoom.messages && chatRoom.messages.length > 0) {
                client.emit('message-history', {
                    messages: [...chatRoom.messages].reverse()
                });
            }

            this.logger.log(`Visitor connected: ${data.visitorId} with session: ${data.sessionId} from IP: ${clientIp}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Visitor connection error: ${error.message}`, 'ChatGateway');

            try {
                await this.connectionTrackingService.removeConnection(sessionId, client.id);
            } catch (error) {
                this.logger.error(`Error cleaning up visitor connection: ${error.message}`, 'ChatGateway');
            }

            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Visitor connection error',
                'VISITOR_CONNECTION_ERROR',
                { sessionId: sessionId, error: error.message }
            );
            client.disconnect(true);
        }
    }

    private async handleAgentConnection(client: Socket, data: ConnectionData, clientIp: string) {

        const { token } = data;

        if (!token) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Token is required',
                'INVALID_TOKEN',
                { token }
            );
            client.disconnect(true);
            return;
        }

        // Verify JWT token with enhanced error handling
        let payload: any;
        try {
            payload = this.jwtService.verify(token);
            if (!payload) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid JWT token',
                    'INVALID_JWT_TOKEN',
                );

                throw new Error('Invalid token payload');
            }
        } catch (jwtError) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid JWT token',
                'INVALID_JWT_TOKEN',
                { jwtError }
            );
            client.disconnect(true);
            return;
        }

        // Validate agent and workspace
        const agent = await this.usersService.validateAgent(payload.userId, payload.workspaceId);
        if (!agent) {
            this.logger.error(`Agent connection rejected: Agent not found or inactive from IP ${clientIp}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Agent not found',
                'AGENT_NOT_FOUND',
                { agentId: payload.userId, workspaceId: payload.workspaceId }
            );
            client.disconnect(true);
            return;
        }

        // Check if the agent is reconnecting within grace period
        const isReconnecting = await this.redis.get(`agent:${payload.userId}:${payload.token}`);
        let previousStatus: AgentStatus | null = null;
        if (isReconnecting) {
            await this.redis.del(`agent:${payload.userId}:${payload.token}`);
            previousStatus = JSON.parse(isReconnecting).previousStatus;
        }

        try {
            // Add agent connection to tracking service
            const connectionData = await this.connectionTrackingService.addAgentConnection(
                payload.userId,
                payload.workspaceId,
                client.id
            );

            // Store connection info
            client.data.authenticated = true;
            client.data.agentId = payload.userId;
            client.data.workspaceId = payload.workspaceId;
            client.data.userType = 'agent';
            client.data.user = agent;
            client.data.clientIp = clientIp;

            // Update agent status
            if (connectionData.status === AgentStatus.ONLINE && !previousStatus) {
                await this.agentService.updateAgentStatus(payload.userId, payload.workspaceId, {
                    status: connectionData.status,
                });
            } else if (previousStatus) {
                const status = previousStatus !== AgentStatus.OFFLINE ? previousStatus : AgentStatus.ONLINE;
                await this.agentService.updateAgentStatus(payload.userId, payload.workspaceId, {
                    status: status,
                });
            }

            const agentJoinedRooms = await this.connectionTrackingService.getAgentJoinedRooms(payload.userId, payload.workspaceId);

            for (const room of agentJoinedRooms) {
                // Join Room
                await client.join(`room:${room}`);
                await client.join(`room:${room}:internal`);

                // Leave View Room
                await client.leave(`room_view:${room}`);

                if (!isReconnecting) {
                    // Create a system message for agent connection
                    await this.chatService.createMessage(
                        randomUUID(),
                        room,
                        'agent-system',
                        `${agent.name} has joined the chat`,
                        false,
                        undefined,
                        undefined,
                        payload.workspaceId,
                    );
                }
            }

            // Ensure agent is in workspace room
            await client.join(`workspace:${payload.workspaceId}`);

            // Join department-specific rooms if agent has departments assigned
            if (agent.userDepartments && agent.userDepartments.length > 0) {
                for (const department of agent.userDepartments) {
                    await client.join(`workspace:${payload.workspaceId}:${department.departmentId}`);
                    await this.departmentService.updateDepartmentStatus(department.departmentId, payload.workspaceId);
                }
            }

            await this.updateVisitorQueuesForClient(client, payload.workspaceId);

            // Notify agent that they have been connected
            client.emit('agent-connected', {
                agentId: payload.userId,
                pastRoomIds: agentJoinedRooms,
                connectedAt: new Date(),
            });

            this.logger.log(`Agent connected: ${payload.userId} from IP: ${clientIp}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Agent connection error: ${error.message}`, 'ChatGateway');

            // Clean up connection tracking if it was added
            try {
                await this.connectionTrackingService.removeAgentConnection(payload.userId, payload.workspaceId, client.id);
            } catch (cleanupError) {
                this.logger.error(`Error cleaning up agent connection: ${cleanupError.message}`, 'ChatGateway');
            }

            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Agent connection error',
                'AGENT_CONNECTION_ERROR',
                { token: token, error: error.message }
            );
            client.disconnect(true);
        }
    }

    // ===========================================================
    // CONNECTION HANDLER METHODS
    // ===========================================================

    async handleConnection(client: Socket) {

        const forwardedFor = client.handshake.headers['x-forwarded-for'];
        const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || client.handshake.address || 'unknown';

        this.connectionStats.totalConnections++;

        try {
            // Validate connection parameters
            const connectionData: ConnectionData = this.extractConnectionData(client);
            if (!this.validateConnectionData(connectionData)) {
                this.connectionStats.failedConnections++;
                this.logger.error(`Connection rejected: Invalid connection data from IP ${clientIp}`, 'ChatGateway');
                client.disconnect(true);
                return;
            }

            // Authenticate based on type
            if (connectionData.visitorId) {
                await this.handleVisitorConnection(client, connectionData, clientIp);
            } else if (connectionData.agentId) {
                await this.handleAgentConnection(client, connectionData, clientIp);
            } else {
                this.connectionStats.failedConnections++;
                this.logger.error(`Connection rejected: Invalid authentication type from IP ${clientIp}`, 'ChatGateway');
                client.disconnect(true);
                return;
            }

            this.connectionStats.activeConnections++;

        } catch (error) {
            this.connectionStats.failedConnections++;
            this.logger.error(`Connection error from IP ${clientIp}: ${error.message}`, 'ChatGateway');
            client.disconnect(true);
        }
    }

    async handleDisconnect(client: Socket) {
        try {
            const { visitorId, agentId, workspaceId, currentDepartmentId, sessionId } = client.data as ConnectionData;

            // Update connection statistics
            if (this.connectionStats.activeConnections > 0) {
                this.connectionStats.activeConnections--;
            }

            if (sessionId && visitorId && workspaceId) {
                // Get active chat rooms for this visitor
                const visitorRooms = await this.chatService.getVisitorActiveRooms(visitorId, workspaceId);

                let connection = await this.connectionTrackingService.getSessionConnections(sessionId);

                await this.redis.set(`visitor:${visitorId}:${sessionId}`, JSON.stringify({ previousStatus: connection?.status }));

                connection = await this.connectionTrackingService.removeConnection(sessionId, client.id);

                if (connection && connection.socketIds.length === 0) {

                    setTimeout(async () => {
                        const isVisitorStillAway = await this.redis.get(`visitor:${visitorId}:${sessionId}`);
                        if (isVisitorStillAway) {
                            await this.redis.del(`visitor:${visitorId}:${sessionId}`);
                            await this.visitorService.updateSessionStatus(sessionId, 'AWAY');
                            await this.connectionTrackingService.removeSessionConnectionData(sessionId);
                            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

                            // Create a system message for visitor disconnection
                            for (const room of visitorRooms) {
                                await this.chatService.createMessage(
                                    randomUUID(),
                                    room.id,
                                    'visitor-system',
                                    `${client.data.visitor?.name || "Visitor"} has left the chat`,
                                    false,
                                    undefined,
                                    undefined,
                                    workspaceId,
                                );

                                const otherParticipants = await this.server.to(`room:${room.id}`).fetchSockets();

                                this.server.to(`room:${room.id}`).emit('participant-disconnected', {
                                    roomId: room.id,
                                    participantId: visitorId,
                                    participantType: 'visitor',
                                    participantName: client.data.visitor?.name,
                                    disconnectedAt: new Date(),
                                });

                                for (const participant of otherParticipants) {
                                    participant.leave(`room:${room.id}`);
                                    await this.connectionTrackingService.removeRoomFromAgentSocket(room.primaryAgentId, workspaceId, participant.id, room.id);
                                    await this.chatService.removeAgentFromRoom(room.id, room.primaryAgentId);
                                    participant.join(`room_view:${room.id}`);
                                }
                            }

                        }
                    }, this.GRACE_PERIOD_FOR_CONNECTION_REMOVAL);

                    for (const room of visitorRooms) {
                        client.leave(`room:${room.id}`);
                    }

                    this.logger.log(`Visitor disconnected: ${sessionId}`, 'ChatGateway');
                } else {
                    for (const room of visitorRooms) {
                        client.leave(`room:${room.id}`);
                    }
                }

            } else if (agentId && workspaceId) {

                // Get active chat rooms for this agent
                const agentRooms = await this.chatService.getAgentActiveRooms(agentId, workspaceId);

                let connection = await this.connectionTrackingService.getAgentConnections(agentId, workspaceId);

                await this.redis.set(`agent:${agentId}:${client.data.token}`, JSON.stringify({ previousStatus: connection?.status }));

                connection = await this.connectionTrackingService.removeAgentConnection(agentId, workspaceId, client.id);

                if (connection && connection.socketIds.length === 0) {

                    setTimeout(async () => {
                        const isAgentStillAway = await this.redis.get(`agent:${agentId}:${client.data.token}`);
                        if (isAgentStillAway) {
                            await this.redis.del(`agent:${agentId}:${client.data.token}`);
                            await this.agentService.updateAgentStatus(agentId, workspaceId, {
                                status: 'OFFLINE',
                            });

                            if (client.data.user.userDepartments && client.data.user.userDepartments.length > 0) {
                                for (const department of client.data.user.userDepartments) {
                                    await this.departmentService.updateDepartmentStatus(department.departmentId, workspaceId);
                                }
                            }

                            // Remove agent from all rooms
                            for (const room of agentRooms) {
                                await this.chatService.removeAgentFromRoom(room.id, agentId);

                                this.server.to(`room:${room.id}`).emit('participant-disconnected', {
                                    roomId: room.id,
                                    participantId: agentId,
                                    participantType: 'agent',
                                    participantName: client.data.user.name,
                                    disconnectedAt: new Date(),
                                });

                                // Create a system message for agent disconnection
                                await this.chatService.createMessage(
                                    randomUUID(),
                                    room.id,
                                    'agent-system',
                                    `${client.data.user.name} has left the chat`,
                                    false,
                                    undefined,
                                    undefined,
                                    workspaceId,
                                );
                            }

                            // Remove agent connection tracking
                            await this.connectionTrackingService.removeAgentConnectionData(agentId, workspaceId);

                            await this.updateVisitorQueuesForClient(client, workspaceId);
                        }
                    }, this.GRACE_PERIOD_FOR_CONNECTION_REMOVAL);

                    client.leave(`workspace:${workspaceId}`);

                    if (client.data.user.userDepartments && client.data.user.userDepartments.length > 0) {
                        for (const department of client.data.user.userDepartments) {
                            client.leave(`workspace:${workspaceId}:${department.departmentId}`);
                        }
                    }

                    // Notify each room about agent disconnection
                    for (const room of agentRooms) {
                        client.leave(`room:${room.id}`);
                        client.leave(`room:${room.id}:internal`);
                    }

                    this.logger.log(`Agent disconnected: ${agentId}`, 'ChatGateway');

                } else {
                    client.leave(`workspace:${workspaceId}`);

                    if (client.data.user.userDepartments && client.data.user.userDepartments.length > 0) {
                        for (const department of client.data.user.userDepartments) {
                            client.leave(`workspace:${workspaceId}:${department.departmentId}`);
                        }
                    }

                    // Notify each room about agent disconnection
                    for (const room of agentRooms) {
                        client.leave(`room:${room.id}`);
                        client.leave(`room:${room.id}:internal`);
                    }
                }
            }

        } catch (error) {
            this.logger.error(`Disconnection error: ${error.message}`, 'ChatGateway');
        }
    }

    // ===========================================================
    // DASHBOARD SOCKET EVENT HANDLERS
    // ===========================================================

    // Get Server Time
    @SubscribeMessage('get-server-time')
    async handleGetServerTime(@ConnectedSocket() client: Socket) {
        client.emit('server-time', {
            time: new Date(),
        });
    }

    // Join agent to chat room
    @SubscribeMessage('join-room')
    async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: AgentRoom) {

        const { agentId, user, workspaceId, authenticated } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to join rooms',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please create a new session.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate room exists
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);
            if (!room) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid room ID. Please refresh the page.',
                    'INVALID_ROOM',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Check if agent is already in this room from a different socket
            const isAlreadyInRoom = await this.connectionTrackingService.isAgentAlreadyInRoom(agentId, workspaceId, data.roomId);

            if (isAlreadyInRoom) {
                // Agent is already in the room from a different socket, just add this socket to the room
                await this.connectionTrackingService.addRoomToAgentSocket(agentId, workspaceId, client.id, data.roomId);

                // Join room
                await client.join(`room:${data.roomId}`);
                await client.join(`room:${data.roomId}:internal`);

                // Leave View Room
                await client.leave(`room_view:${data.roomId}`);

                client.emit('room-joined', {
                    roomId: data.roomId,
                    joinedAt: new Date(),
                });

                await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

                this.logger.log(`Agent ${user.name}-${agentId} joined room ${data.roomId} from additional socket ${client.id}`, 'ChatGateway');
                return;
            }

            // Add room to agent's connection tracking
            const connectionData = await this.connectionTrackingService.addRoomToAgentSocket(agentId, workspaceId, client.id, data.roomId);

            const response = await this.chatService.addAgentToRoom(data.roomId, agentId);

            if (!response || !response.success) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Failed to join room',
                    'ROOM_JOIN_ERROR',
                    { agentId, roomId: data.roomId }
                );
                await this.connectionTrackingService.removeRoomFromAgentSocket(agentId, workspaceId, client.id, data.roomId);
                return;
            }

            // Update agent status based on connection tracking
            if (connectionData) {
                await this.agentService.updateAgentStatus(agentId, workspaceId, {
                    status: connectionData.status,
                    currentRoomId: data.roomId,
                });
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update current handled department
            client.data.currentDepartmentId = room.department?.id || null;

            // Update department status
            if (user.userDepartments && user.userDepartments.length > 0) {
                for (const department of user.userDepartments) {
                    await this.departmentService.updateDepartmentStatus(department.departmentId, workspaceId);
                }
            }

            // Join room
            await client.join(`room:${data.roomId}`);
            await client.join(`room:${data.roomId}:internal`);

            // Leave View Room
            await client.leave(`room_view:${data.roomId}`);

            // Create a system message for agent connection
            await this.chatService.createMessage(
                randomUUID(),
                data.roomId,
                'agent-system',
                `${user.name} has joined the chat`,
                false,
                undefined,
                undefined,
                workspaceId,
            );

            // Notify participants in the room about the new participant
            this.server.to(`room:${data.roomId}`).emit('agent-joined-room', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify viewing agents about new agent joining
            this.server.to(`room_view:${data.roomId}`).emit('agent-joined-room', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Update visitor queues in workspace in respective department
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            this.logger.log(`Agent ${user.name}-${agentId} joined room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error joining room: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to join room',
                'ROOM_JOIN_ERROR',
                { error: error.message }
            );
        }
    }

    // Remove agent from chat room
    @SubscribeMessage('leave-room')
    async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: AgentRoom) {

        const { agentId, workspaceId, authenticated, user } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to leave rooms',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Room ID is required',
                'INVALID_ROOM',
                { roomId: data.roomId }
            );
            return;
        }

        try {
            // Validate room exists
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);
            if (!room) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid room ID. Please refresh the page.',
                    'INVALID_ROOM',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Check if agent is still in this room from other socket connections
            const isStillInRoomFromOtherSockets = await this.connectionTrackingService.isAgentAlreadyInRoomFromDifferentSocket(agentId, workspaceId, client.id, data.roomId);

            if (isStillInRoomFromOtherSockets) {
                // Agent is still in the room from other sockets, just remove this socket from the room
                await this.connectionTrackingService.removeRoomFromAgentSocket(agentId, workspaceId, client.id, data.roomId);

                // Leave room
                await client.leave(`room:${data.roomId}`);
                await client.leave(`room:${data.roomId}:internal`);

                this.logger.log(`Agent ${client.data.user.name}-${agentId} left room ${data.roomId} from socket ${client.id} (still in room from other sockets)`, 'ChatGateway');
                return;
            }

            // Remove room from agent's connection tracking
            const connectionData = await this.connectionTrackingService.removeRoomFromAgentSocket(agentId, workspaceId, client.id, data.roomId);

            // Remove agent from room
            await this.chatService.removeAgentFromRoom(data.roomId, agentId);

            // Update agent status based on connection tracking
            if (connectionData) {
                await this.agentService.updateAgentStatus(agentId, workspaceId, {
                    status: connectionData.status,
                    currentRoomId: data.roomId,
                });
            }

            // Update visitor session status based on connection tracking and db status
            const visitorDBSession = await this.visitorService.getVisitorSessionById(room.visitorSessionId);
            const visitorTrackingSession = await this.connectionTrackingService.getSessionConnections(room.visitorSessionId);

            if (visitorDBSession && visitorTrackingSession && (visitorDBSession.status === SessionStatus.CURRENTLY_SERVED)) {
                console.log('visitorDBSession', visitorDBSession);
                console.log('visitorTrackingSession', visitorTrackingSession);
                if (visitorTrackingSession.status === SessionStatus.IDLE) {
                    await this.visitorService.updateSessionStatus(room.visitorSessionId, SessionStatus.IDLE);
                } else if (visitorTrackingSession.status === SessionStatus.CURRENTLY_SERVED) {
                    await this.visitorService.updateSessionStatus(room.visitorSessionId, SessionStatus.ACTIVE);
                    await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.ACTIVE);
                }
            }

            // Update visitor queues in workspace in respective department
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            // Update current handled department
            client.data.currentDepartmentId = null;

            // Update department status
            if (user.userDepartments && user.userDepartments.length > 0) {
                for (const department of user.userDepartments) {
                    await this.departmentService.updateDepartmentStatus(department.departmentId, workspaceId);
                }
            }

            // Leave room
            await client.leave(`room:${data.roomId}`);
            await client.leave(`room:${data.roomId}:internal`);

            // Create a system message for agent disconnection
            await this.chatService.createMessage(
                randomUUID(),
                data.roomId,
                'agent-system',
                `${client.data.user.name} has left the chat`,
                false,
                undefined,
                undefined,
                workspaceId,
            );

            // Notify agents in the room about the participant leaving
            this.server.to(`room:${data.roomId}`).emit('agent-left-room', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                leftAt: new Date(),
            });

            // Notify viewing agents about the agent leaving
            this.server.to(`room_view:${data.roomId}`).emit('agent-left-room', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                leftAt: new Date(),
            });

            await this.updateVisitorQueuesForClient(client, workspaceId);

            this.logger.log(`Agent ${client.data.user.name}-${agentId} left room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            await client.leave(`room:${data.roomId}`);
            this.logger.error(`Error leaving room: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to leave room',
                'ROOM_LEAVE_ERROR',
                { error: error.message }
            );
        }
    }

    // Agent View Room
    @SubscribeMessage('view-room')
    async handleViewRoom(@ConnectedSocket() client: Socket, @MessageBody() data: AgentRoom) {

        const { agentId, workspaceId, authenticated } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to view rooms',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Room ID is required',
                'INVALID_ROOM',
                { roomId: data.roomId }
            );
            return;
        }

        try {
            // Validate room exists
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);
            if (!room) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid room ID. Please refresh the page.',
                    'INVALID_ROOM',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            const agentJoinedRooms = await this.connectionTrackingService.getAgentJoinedRooms(agentId, workspaceId);

            if (!agentJoinedRooms.includes(data.roomId)) {
                // Join a View Room
                await client.join(`room_view:${data.roomId}`);
            }

            // Return the room details to viewing agent
            client.emit('room-details', {
                roomDetails: room
            });

            // Update chat window status to OPEN
            await this.chatService.updateChatWindowStatus(agentId, data.roomId, 'OPEN');

            this.logger.log(`Agent ${client.data.user.name}-${agentId} viewed room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error viewing room: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to view room',
                'ROOM_VIEW_ERROR',
                { error: error.message }
            );
        }
    }

    // Agent Close Room
    @SubscribeMessage('close-room')
    async handleCloseRoom(@ConnectedSocket() client: Socket, @MessageBody() data: AgentRoomClose) {

        const { agentId, workspaceId, authenticated } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to exit room view',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Room ID is required',
                'INVALID_ROOM',
                { roomId: data.roomId }
            );
            return;
        }

        try {

            // Leave a View Room
            await client.leave(`room_view:${data.roomId}`);

            // Update chat window status to CLOSED or MINIMIZED
            await this.chatService.updateChatWindowStatus(agentId, data.roomId, data.status, data.roomInFocus);

            this.logger.log(`Agent ${client.data.user.name}-${agentId} closed or minimized room view ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error exiting room view: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to exit room view',
                'ROOM_EXIT_VIEW_ERROR',
                { error: error.message }
            );
        }
    }

    // Send Agent Message to Chat Room
    @SubscribeMessage('agent-message')
    async handleAgentMessage(@ConnectedSocket() client: Socket, @MessageBody() data: ClientMessage) {

        const { agentId, workspaceId, authenticated } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to send messages',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Room ID is required',
                'INVALID_ROOM',
                { roomId: data.roomId }
            );
            return;
        }

        // Validate message content
        if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Message content is required and cannot be empty or invalid',
                'INVALID_MESSAGE',
                { agentId, workspaceId, roomId: data.roomId, messageId: data.messageId }
            );
            return;
        }

        if (!data.messageId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Message ID is required',
                'INVALID_MESSAGE',
                { agentId, workspaceId, roomId: data.roomId, messageId: data.messageId }
            );
            return;
        }

        try {
            // Create message using the service
            const createdMessage = await this.chatService.createMessage(
                data.messageId,
                data.roomId,
                'agent',
                data.message.trim(),
                data.isInternal || false,
                undefined,
                agentId,
                workspaceId
            );

            const agentConnections = (await this.connectionTrackingService.getAgentConnections(agentId, workspaceId))?.socketIds || client.id;
            const recipients = await this.server.to(`room:${data.roomId}`).except(agentConnections).fetchSockets();
            // Get receipient ids from their connections
            const recipientIds = [...new Set(
                recipients.map(r => r.data.userType === 'agent' ? r.data.agentId : r.data.sessionId)
            )];

            // Add message to tracking
            const trackedMessage: TrackedMessage = {
                messageId: createdMessage.id,
                roomId: data.roomId,
                content: data.message.trim(),
                senderType: 'agent',
                senderId: agentId,
                recipients: recipientIds,
                createdAt: createdMessage.createdAt,
                workspaceId: workspaceId,
                senderName: client.data.user.name,
            };

            await this.messageTrackingService.addMessage(data.roomId, trackedMessage);

            // Send acknowledgment back to agent
            client.emit('message-ack', {
                roomId: data.roomId,
                messageId: data.messageId,
                status: 'sent',
                senderType: 'agent',
                senderId: agentId,
                senderName: client.data.user.name,
                sentAt: createdMessage.createdAt
            });

            // Notify agents in the room about the new message
            this.server.to(`room:${data.roomId}`).except(client.id).emit('new-message', {
                messageId: createdMessage.id,
                roomId: data.roomId,
                content: data.message.trim(),
                senderId: agentId,
                senderType: 'agent',
                senderName: client.data.user.name,
                sentAt: createdMessage.createdAt,
                workspaceId
            });

            // Notify viewing agents about the new message
            this.server.to(`room_view:${data.roomId}`).emit('new-message', {
                messageId: createdMessage.id,
                roomId: data.roomId,
                content: data.message.trim(),
                senderId: agentId,
                senderType: 'agent',
                senderName: client.data.user.name,
                sentAt: createdMessage.createdAt,
                workspaceId
            });

            this.logger.log(`Agent message processed: ${agentId} in room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing agent message: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to process agent message',
                'MESSAGE_PROCESSING_ERROR',
                { error: error.message }
            );
        }
    }

    // Transfer Chat to Agent (Within Department)
    @SubscribeMessage('transfer-chat-to-agent')
    async handleTransferChatToAgent(@ConnectedSocket() client: Socket, @MessageBody() data: TransferChatToAgent) {

        const { agentId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to transfer chats',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, roomId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate target agent exists and is available
            const targetAgentStatus = await this.agentService.getAgentStatus(data.targetAgentId);
            if (!targetAgentStatus || targetAgentStatus.status === 'OFFLINE') {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Target agent not found or is offline',
                    'AGENT_NOT_FOUND',
                    { targetAgentId: data.targetAgentId }
                );
                return;
            }

            // Get target agent's socket ID from their status
            const targetAgentSocketId = targetAgentStatus.socketId;

            if (!targetAgentSocketId) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Target agent is not currently online',
                    'AGENT_OFFLINE',
                    { targetAgentId: data.targetAgentId }
                );
                return;
            }

            const transferId = data.transferId || `transfer_${Date.now()}`;

            // Store transfer request in Redis for validation
            const transferRequestData = {
                roomId: roomId,
                fromAgentId: agentId,
                fromAgentName: client.data.user.name,
                targetAgentId: data.targetAgentId,
                transferReason: data.reason || 'Manual transfer',
                timestamp: new Date(),
                workspaceId: workspaceId,
                requestingAgentSocketId: client.id, // Track requesting agent's socket ID
            };

            await this.redis.set(
                `transfer_request:${transferId}`,
                JSON.stringify(transferRequestData)
            );

            // Get room details
            const room = await this.chatService.getRoomById(roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'PENDING_TRANSFER');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.PENDING_TRANSFER);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            // Send transfer request to specific target agent
            this.server.to(targetAgentSocketId).emit('chat-transfer-request', {
                roomId: roomId,
                fromAgentId: agentId,
                fromAgentName: client.data.user.name,
                transferReason: data.reason || 'Manual transfer',
                timestamp: new Date(),
                transferId: transferId,
            });

            // Send acknowledgment to the requesting agent
            client.emit('transfer-request-sent', {
                roomId: roomId,
                targetAgentId: data.targetAgentId,
                timestamp: new Date(),
                transferId: transferId,
            });

            this.logger.log(`Chat transfer request sent: ${agentId} -> ${data.targetAgentId} for room ${roomId} with transferId: ${transferId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing chat transfer: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to process chat transfer',
                'TRANSFER_ERROR',
                { error: error.message }
            );
        }
    }

    // Accept Transfer Request (Within Department)
    @SubscribeMessage('accept-chat-transfer-request')
    async handleAcceptChatTransferRequest(@ConnectedSocket() client: Socket, @MessageBody() data: ChatTransferAcceptOrReject) {

        const { agentId, workspaceId, authenticated, user } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to accept transfer requests',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate transfer request data
            if (!data.transferId || !data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid transfer request data',
                    'INVALID_TRANSFER_DATA',
                    { transferId: data.transferId, roomId: data.roomId }
                );
                return;
            }

            // Validate that this transfer request exists and is valid
            const transferRequestKey = `transfer_request:${data.transferId}`;
            const transferRequest = await this.redis.get(transferRequestKey);

            if (!transferRequest) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Transfer request not found or has expired',
                    'INVALID_TRANSFER_REQUEST',
                    { transferId: data.transferId, roomId: data.roomId }
                );
                return;
            }

            const transferData = JSON.parse(transferRequest);

            // Validate that the transfer request is for the correct room
            if (transferData.roomId !== data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Transfer request room mismatch',
                    'TRANSFER_ROOM_MISMATCH',
                    { transferId: data.transferId, expectedRoomId: transferData.roomId, providedRoomId: data.roomId }
                );
                return;
            }

            // Validate that the accepting agent is the intended target
            if (transferData.targetAgentId && transferData.targetAgentId !== agentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this transfer request',
                    'UNAUTHORIZED_TRANSFER_ACCEPTANCE',
                    { transferId: data.transferId, intendedTarget: transferData.targetAgentId, acceptingAgent: agentId }
                );
                return;
            }

            // Call the service method to handle the transfer acceptance
            const transferResult = await this.chatService.handleChatTransferAcceptance(agentId, data.roomId);

            if (!transferResult || !transferResult.success) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Failed to process transfer acceptance',
                    'TRANSFER_ACCEPTANCE_ERROR',
                    { agentId, roomId: data.roomId }
                );
                return;
            }

            // Remove the transfer request from Redis since it's been accepted
            await this.redis.del(transferRequestKey);

            // Add room to agent's connection tracking
            const connectionData = await this.connectionTrackingService.addRoomToAgentSocket(agentId, workspaceId, client.id, data.roomId);

            // Update agent status based on connection tracking
            if (connectionData) {
                await this.agentService.updateAgentStatus(agentId, workspaceId, {
                    status: connectionData.status,
                    currentRoomId: data.roomId,
                });
            }

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective department
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            // Update department status
            if (user.userDepartments && user.userDepartments.length > 0) {
                for (const department of user.userDepartments) {
                    await this.departmentService.updateDepartmentStatus(department.departmentId, workspaceId);
                }
            }

            // Join the room if not already joined
            await client.join(`room:${data.roomId}`);

            // Leave the view room
            await client.leave(`room_view:${data.roomId}`);

            // Send acceptance acknowledgment to the accepting agent
            client.emit('transfer-accepted', {
                roomId: data.roomId,
                transferId: data.transferId,
                acceptedAt: new Date(),
            });

            // Notify room about agent joining
            this.server.to(`room:${data.roomId}`).except(client.id).emit('agent-joined', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify room view about agent joining
            this.server.to(`room_view:${data.roomId}`).emit('agent-joined', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify the requesting agent (if they're still online) about the acceptance
            if (transferResult.fromAgentId) {
                const requestingAgentStatus = await this.agentService.getAgentStatus(transferResult.fromAgentId);
                if (requestingAgentStatus && requestingAgentStatus.socketId) {
                    this.server.to(requestingAgentStatus.socketId).emit('transfer-accepted-by-agent', {
                        roomId: data.roomId,
                        transferId: data.transferId,
                        fromAgentId: transferResult.fromAgentId,
                        toAgentId: transferResult.toAgentId,
                        acceptedAt: new Date(),
                        acceptingAgentName: client.data.user.name,
                    });
                }
            }

            this.logger.log(`Chat transfer accepted: ${transferResult.fromAgentId || 'No previous agent'} -> ${agentId} for room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing transfer acceptance: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to accept transfer request',
                'TRANSFER_ACCEPTANCE_ERROR',
                { error: error.message }
            );
        }
    }

    // Reject Transfer Request (Within Department)
    @SubscribeMessage('reject-chat-transfer-request')
    async handleChatTransferRejected(@ConnectedSocket() client: Socket, @MessageBody() data: ChatTransferAcceptOrReject) {
        const { agentId, workspaceId, authenticated } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to reject transfer requests',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate transfer request data
            if (!data.transferId || !data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid transfer request data',
                    'INVALID_TRANSFER_DATA',
                    { transferId: data.transferId, roomId: data.roomId }
                );
                return;
            }

            // Validate that this transfer request exists and is valid
            const transferRequestKey = `transfer_request:${data.transferId}`;
            const transferRequest = await this.redis.get(transferRequestKey);

            if (!transferRequest) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Transfer request not found or has expired',
                    'INVALID_TRANSFER_REQUEST',
                    { transferId: data.transferId, roomId: data.roomId }
                );
                return;
            }

            const transferData = JSON.parse(transferRequest);

            // Validate that the transfer request is for the correct room
            if (transferData.roomId !== data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Transfer request room mismatch',
                    'TRANSFER_ROOM_MISMATCH',
                    { transferId: data.transferId, expectedRoomId: transferData.roomId, providedRoomId: data.roomId }
                );
                return;
            }

            // Validate that the rejecting agent is the intended target
            if (transferData.targetAgentId && transferData.targetAgentId !== agentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this transfer request',
                    'UNAUTHORIZED_TRANSFER_REJECTION',
                    { transferId: data.transferId, intendedTarget: transferData.targetAgentId, rejectingAgent: agentId }
                );
                return;
            }

            // Remove the transfer request from Redis since it's been rejected
            await this.redis.del(transferRequestKey);

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            // Notify the requesting agent about the rejection
            if (transferData.requestingAgentSocketId) {
                this.server.to(transferData.requestingAgentSocketId).emit('transfer-rejected-by-agent', {
                    roomId: data.roomId,
                    transferId: data.transferId,
                    fromAgentId: transferData.fromAgentId,
                    toAgentId: agentId,
                    rejectedAt: new Date(),
                    rejectingAgentName: client.data.user.name,
                    reason: 'Transfer request rejected by agent',
                });
            }

            // Send acknowledgment to the rejecting agent
            client.emit('transfer-request-rejected', {
                roomId: data.roomId,
                transferId: data.transferId,
                rejectedAt: new Date(),
            });

            this.logger.log(`Chat transfer rejected: ${agentId} rejected transfer ${data.transferId} for room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing chat transfer rejection: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to reject transfer request',
                'TRANSFER_REJECTION_ERROR',
                { error: error.message }
            );
        }
    }

    // Invite Agent to Chat (Within Department)
    @SubscribeMessage('invite-agent-to-chat')
    async handleInviteAgentToChat(@ConnectedSocket() client: Socket, @MessageBody() data: InviteAgentToChat) {

        const { agentId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to invite agents to chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, roomId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate target agent exists and is available
            const targetAgentStatus = await this.agentService.getAgentStatus(data.targetAgentId);
            if (!targetAgentStatus || targetAgentStatus.status === 'OFFLINE') {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Target agent not found or is offline',
                    'AGENT_NOT_FOUND',
                    { targetAgentId: data.targetAgentId }
                );
                return;
            }

            // Get target agent's socket ID from their status
            const targetAgentSocketId = targetAgentStatus.socketId;

            if (!targetAgentSocketId) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Target agent is not currently online',
                    'AGENT_OFFLINE',
                    { targetAgentId: data.targetAgentId }
                );
                return;
            }

            const inviteId = data.inviteId || `invite_${Date.now()}`;

            // Store invitation request in Redis for validation
            const invitationRequestData = {
                roomId: roomId,
                fromAgentId: agentId,
                fromAgentName: client.data.user.name,
                targetAgentId: data.targetAgentId,
                inviteReason: data.reason || 'Invitation to chat',
                timestamp: new Date(),
                workspaceId: workspaceId,
                requestingAgentSocketId: client.id, // Track requesting agent's socket ID
            };

            await this.redis.set(
                `invitation_request:${inviteId}`,
                JSON.stringify(invitationRequestData)
            );

            // Get room details
            const room = await this.chatService.getRoomById(roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'PENDING_INVITE');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.PENDING_INVITE);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            // Send invitation to specific target agent
            this.server.to(targetAgentSocketId).emit('chat-invitation', {
                roomId: roomId,
                fromAgentId: agentId,
                fromAgentName: client.data.user.name,
                inviteReason: data.reason || 'Invitation to chat',
                timestamp: new Date(),
                inviteId: inviteId,
            });

            // Send acknowledgment to inviting agent
            client.emit('invitation-sent', {
                roomId: roomId,
                targetAgentId: data.targetAgentId,
                timestamp: new Date(),
                inviteId: inviteId,
            });

            this.logger.log(`Chat invitation sent: ${agentId} -> ${data.targetAgentId} for room ${roomId} with inviteId: ${inviteId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing chat invitation: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to process chat invitation',
                'INVITATION_ERROR',
                { error: error.message }
            );
        }
    }

    // Accept Invitation (Within Department)
    @SubscribeMessage('accept-chat-invitation')
    async handleChatInvitationAccepted(@ConnectedSocket() client: Socket, @MessageBody() data: ChatInvitationAcceptOrReject) {

        const { agentId, workspaceId, authenticated, user } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to accept chat invitations',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate invitation data
            if (!data.inviteId || !data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid invitation data',
                    'INVALID_INVITATION_DATA',
                    { inviteId: data.inviteId, roomId: data.roomId }
                );
                return;
            }

            // Validate that this invitation request exists and is valid
            const invitationRequestKey = `invitation_request:${data.inviteId}`;
            const invitationRequest = await this.redis.get(invitationRequestKey);

            if (!invitationRequest) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invitation request not found or has expired',
                    'INVALID_INVITATION_REQUEST',
                    { inviteId: data.inviteId, roomId: data.roomId }
                );
                return;
            }

            const invitationData = JSON.parse(invitationRequest);

            // Validate that the invitation request is for the correct room
            if (invitationData.roomId !== data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invitation request room mismatch',
                    'INVITATION_ROOM_MISMATCH',
                    { inviteId: data.inviteId, expectedRoomId: invitationData.roomId, providedRoomId: data.roomId }
                );
                return;
            }

            // Validate that the accepting agent is the intended target
            if (invitationData.targetAgentId && invitationData.targetAgentId !== agentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this invitation',
                    'UNAUTHORIZED_INVITATION_ACCEPTANCE',
                    { inviteId: data.inviteId, intendedTarget: invitationData.targetAgentId, acceptingAgent: agentId }
                );
                return;
            }

            // Call the service method to handle the invitation acceptance
            const invitationResult = await this.chatService.handleChatInvitationAcceptance(agentId, data.roomId);

            if (!invitationResult || !invitationResult.success) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Failed to process invitation acceptance',
                    'INVITATION_ACCEPTANCE_ERROR',
                    { agentId, roomId: data.roomId }
                );
                return;
            }

            // Remove the invitation request from Redis since it's been accepted
            await this.redis.del(invitationRequestKey);

            // Add room to agent's connection tracking
            const connectionData = await this.connectionTrackingService.addRoomToAgentSocket(agentId, workspaceId, client.id, data.roomId);

            // Update agent status based on connection tracking
            if (connectionData) {
                await this.agentService.updateAgentStatus(agentId, workspaceId, {
                    status: connectionData.status,
                    currentRoomId: data.roomId,
                });
            }

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            // Update department status
            if (user.userDepartments && user.userDepartments.length > 0) {
                for (const department of user.userDepartments) {
                    await this.departmentService.updateDepartmentStatus(department.departmentId, workspaceId);
                }
            }

            // Join the room if not already joined
            await client.join(`room:${data.roomId}`);

            // Leave the view room
            await client.leave(`room_view:${data.roomId}`);

            // Send acceptance acknowledgment to the accepting agent
            client.emit('invitation-accepted', {
                roomId: data.roomId,
                inviteId: data.inviteId,
                joinedAt: new Date(),
            });

            // Notify all participants in the room about the new agent joining
            this.server.to(`room:${data.roomId}`).except(client.id).emit('agent-joined', {
                roomId: data.roomId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify room view about the new agent joining
            this.server.to(`room_view:${data.roomId}`).emit('agent-joined', {
                roomId: data.roomId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            this.logger.log(`Chat invitation accepted: ${agentId} joined room ${data.roomId} alongside primary agent ${invitationResult.invitationData?.primaryAgentId || 'None'}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing chat invitation acceptance: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to accept chat invitation',
                'INVITATION_ACCEPTANCE_ERROR',
                { error: error.message }
            );
        }
    }

    // Reject Invitation (Within Department)
    @SubscribeMessage('reject-chat-invitation')
    async handleChatInvitationRejected(@ConnectedSocket() client: Socket, @MessageBody() data: ChatInvitationAcceptOrReject) {
        const { agentId, workspaceId, authenticated } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to reject chat invitations',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate invitation data
            if (!data.inviteId || !data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid invitation data',
                    'INVALID_INVITATION_DATA',
                    { inviteId: data.inviteId, roomId: data.roomId }
                );
                return;
            }

            // Validate that this invitation request exists and is valid
            const invitationRequestKey = `invitation_request:${data.inviteId}`;
            const invitationRequest = await this.redis.get(invitationRequestKey);

            if (!invitationRequest) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invitation request not found or has expired',
                    'INVALID_INVITATION_REQUEST',
                    { inviteId: data.inviteId, roomId: data.roomId }
                );
                return;
            }

            const invitationData = JSON.parse(invitationRequest);

            // Validate that the invitation request is for the correct room
            if (invitationData.roomId !== data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invitation request room mismatch',
                    'INVITATION_ROOM_MISMATCH',
                    { inviteId: data.inviteId, expectedRoomId: invitationData.roomId, providedRoomId: data.roomId }
                );
                return;
            }

            // Validate that the rejecting agent is the intended target
            if (invitationData.targetAgentId && invitationData.targetAgentId !== agentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this invitation',
                    'UNAUTHORIZED_INVITATION_REJECTION',
                    { inviteId: data.inviteId, intendedTarget: invitationData.targetAgentId, rejectingAgent: agentId }
                );
                return;
            }

            // Remove the invitation request from Redis since it's been rejected
            await this.redis.del(invitationRequestKey);

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            // Notify the inviting agent about the rejection
            if (invitationData.requestingAgentSocketId) {
                this.server.to(invitationData.requestingAgentSocketId).emit('invitation-rejected-by-agent', {
                    roomId: data.roomId,
                    inviteId: data.inviteId,
                    fromAgentId: invitationData.fromAgentId,
                    toAgentId: agentId,
                    rejectedAt: new Date(),
                    rejectingAgentName: client.data.user.name,
                    reason: 'Invitation rejected by agent',
                });
            }

            // Send acknowledgment to the inviting agent
            client.emit('invitation-rejected', {
                roomId: data.roomId,
                inviteId: data.inviteId,
                rejectedAt: new Date(),
            });

            this.logger.log(`Chat invitation rejected: ${agentId} rejected invitation ${data.inviteId} for room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing chat invitation rejection: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to reject chat invitation',
                'INVITATION_REJECTION_ERROR',
                { error: error.message }
            );
        }
    }

    // Transfer Chat to Department (Inter-Department)
    @SubscribeMessage('transfer-chat-to-department')
    async handleTransferChatToDepartment(@ConnectedSocket() client: Socket, @MessageBody() data: TransferChatToDepartment) {

        const { agentId, roomId, workspaceId, authenticated, currentDepartmentId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to transfer chat to department',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !currentDepartmentId || !roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, currentDepartmentId, roomId }
            );
            client.disconnect(true);
            return;
        }

        try {

            if (!data.targetDepartmentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Target department is required',
                    'TARGET_DEPARTMENT_REQUIRED'
                );
                return;
            }

            // Validate that the department exists and is available
            const department = await this.departmentService.getDepartmentById(data.targetDepartmentId, workspaceId);

            if (!department) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Target department not found',
                    'TARGET_DEPARTMENT_NOT_FOUND'
                );
                return;
            }

            // Handle transfer request
            await this.chatService.handleDepartmentTransferRequest(currentDepartmentId, data.targetDepartmentId, roomId, workspaceId);

            const transferId = data.transferId || `department_transfer_${Date.now()}`;

            // Store transfer request in Redis for validation
            const transferRequestData = {
                roomId: roomId,
                fromDepartmentId: currentDepartmentId,
                targetDepartmentId: data.targetDepartmentId,
                transferReason: data.reason || 'Manual transfer',
                timestamp: new Date(),
                workspaceId: workspaceId,
                requestingAgentSocketId: client.id, // Track requesting agent's socket ID
            };

            await this.redis.set(
                `department_transfer_request:${transferId}`,
                JSON.stringify(transferRequestData)
            );

            // Get room details
            const room = await this.chatService.getRoomById(roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'PENDING_TRANSFER');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.PENDING_TRANSFER);

            // Send acknowledgment to the requesting agent
            client.emit('transfer-request-sent', {
                roomId: roomId,
                targetDepartmentId: data.targetDepartmentId,
                timestamp: new Date(),
                transferId: transferId,
            });

            // Notify department room about incoming transfer request
            this.server.to(`workspace:${workspaceId}:${data.targetDepartmentId}`).emit('new-transfer-request', {
                roomId: roomId,
                fromDepartmentId: currentDepartmentId,
                transferReason: data.reason || 'Manual transfer',
                timestamp: new Date(),
                workspaceId: workspaceId,
                transferId: transferId,
            });

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, data.targetDepartmentId);
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

        } catch (error) {
            this.logger.error(`Error processing chat transfer to department: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to transfer chat to department',
                'TRANSFER_TO_DEPARTMENT_ERROR',
                { error: error.message }
            );
        }
    }

    // Accept Transfer Request (Inter-Department)
    @SubscribeMessage('accept-department-transfer-request')
    async handleAcceptDepartmentTransferRequest(@ConnectedSocket() client: Socket, @MessageBody() data: ChatTransferToDepartmentAcceptOrReject) {

        const { agentId, workspaceId, authenticated, currentDepartmentId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to accept department transfer request',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !currentDepartmentId || !data.roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, currentDepartmentId, roomId: data.roomId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate that the transfer request exists and is valid
            const transferRequestKey = `department_transfer_request:${data.transferId}`;
            const transferRequest = await this.redis.get(transferRequestKey);

            if (!transferRequest) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Transfer request not found or has expired',
                    'INVALID_TRANSFER_REQUEST',
                    { transferId: data.transferId, roomId: data.roomId }
                );
                return;
            }

            const transferData = JSON.parse(transferRequest);

            // Validate that the accepting agent is the intended target
            if (transferData.targetDepartmentId && transferData.targetDepartmentId !== currentDepartmentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this transfer request',
                    'UNAUTHORIZED_TRANSFER_ACCEPTANCE',
                    { transferId: data.transferId, intendedTarget: transferData.targetDepartmentId, acceptingAgent: currentDepartmentId }
                );
                return;
            }

            // Remove the transfer request from Redis since it's been accepted
            await this.redis.del(transferRequestKey);

            // Accept the transfer request
            await this.chatService.handleAcceptDepartmentTransfer(currentDepartmentId, transferData.targetDepartmentId, data.roomId, workspaceId);

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, transferData.fromDepartmentId);
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

            // Join the room
            await client.join(`room:${data.roomId}`);

            // Leave the view room
            await client.leave(`room_view:${data.roomId}`);

            // Send acknowledgement to the requesting agent
            client.emit('transfer-request-accepted', {
                roomId: data.roomId,
                transferId: data.transferId,
                targetDepartmentId: transferData.targetDepartmentId,
                acceptedAt: new Date(),
                acceptingAgentName: client.data.user.name,
            });

            // Notify room about agent joining
            this.server.to(`room:${data.roomId}`).except(client.id).emit('agent-joined', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify room view about agent joining
            this.server.to(`room_view:${data.roomId}`).emit('agent-joined', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify the requesting agent about the acceptance
            if (transferData.requestingAgentSocketId) {
                this.server.to(transferData.requestingAgentSocketId).emit('transfer-request-accepted', {
                    roomId: data.roomId,
                    transferId: data.transferId,
                    targetDepartmentId: transferData.targetDepartmentId,
                    acceptedAt: new Date(),
                    acceptingAgentName: client.data.user.name,
                    reason: 'Transfer request accepted by agent',
                });
            }

            this.logger.log(`Department transfer request accepted: ${currentDepartmentId} accepted transfer request ${data.transferId} for room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing department transfer request acceptance: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to accept department transfer request',
                'TRANSFER_ACCEPTANCE_ERROR',
                { error: error.message }
            );
        }
    }

    // Reject Transfer Request (Inter-Department)
    @SubscribeMessage('reject-department-transfer-request')
    async handleRejectDepartmentTransferRequest(@ConnectedSocket() client: Socket, @MessageBody() data: ChatTransferToDepartmentAcceptOrReject) {

        const { agentId, workspaceId, authenticated, currentDepartmentId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to reject department transfer request',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !currentDepartmentId || !data.roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, currentDepartmentId, roomId: data.roomId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Validate that the transfer request exists and is valid
            const transferRequestKey = `department_transfer_request:${data.transferId}`;
            const transferRequest = await this.redis.get(transferRequestKey);

            if (!transferRequest) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Transfer request not found or has expired',
                    'INVALID_TRANSFER_REQUEST',
                    { transferId: data.transferId, roomId: data.roomId }
                );
                return;
            }

            const transferData = JSON.parse(transferRequest);

            // Validate that the rejecting agent is the intended target
            if (transferData.targetDepartmentId && transferData.targetDepartmentId !== currentDepartmentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this transfer request',
                    'UNAUTHORIZED_TRANSFER_REJECTION',
                    { transferId: data.transferId, intendedTarget: transferData.targetDepartmentId, rejectingAgent: currentDepartmentId }
                );
                return;
            }

            // Remove the transfer request from Redis since it's been rejected
            await this.redis.del(transferRequestKey);

            // Cancel the transfer request
            await this.chatService.handleCancelDepartmentTransfer(currentDepartmentId, transferData.targetDepartmentId, data.roomId, workspaceId);

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, transferData.fromDepartmentId);
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

            // Notify the requesting agent about the rejection
            if (transferData.requestingAgentSocketId) {
                this.server.to(transferData.requestingAgentSocketId).emit('transfer_request_rejected', {
                    roomId: data.roomId,
                    transferId: data.transferId,
                    targetDepartmentId: transferData.targetDepartmentId,
                    rejectedAt: new Date(),
                    rejectingAgentName: client.data.user.name,
                    reason: 'Transfer request rejected by agent',
                });
            }

            // Send acknowledgment to the rejecting agent
            client.emit('transfer-request-rejected', {
                roomId: data.roomId,
                transferId: data.transferId,
                rejectedAt: new Date(),
            });

            this.logger.log(`Department transfer request rejected: ${currentDepartmentId} rejected transfer request ${data.transferId} for room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing department transfer request rejection: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to reject department transfer request',
                'TRANSFER_REJECTION_ERROR',
                { error: error.message }
            );
        }
    }

    // Invite Department to Chat (Inter-Department)
    @SubscribeMessage('invite-department-to-chat')
    async handleInviteDepartmentToChat(@ConnectedSocket() client: Socket, @MessageBody() data: InviteDepartmentToChat) {

        const { agentId, roomId, workspaceId, authenticated, currentDepartmentId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to invite departments to chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !currentDepartmentId || !roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, currentDepartmentId, roomId }
            );
            client.disconnect(true);
            return;
        }

        try {

            // Validate that the target department exists
            const targetDepartment = await this.departmentService.getDepartmentById(data.targetDepartmentId, workspaceId);
            if (!targetDepartment || !targetDepartment.isActive) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Target department not found or is inactive',
                    'INVALID_DEPARTMENT',
                    { targetDepartmentId: data.targetDepartmentId }
                );
                return;
            }

            // Handle department invite
            await this.chatService.handleInviteDepartmentToChat(currentDepartmentId, data.targetDepartmentId, roomId, workspaceId);

            const inviteId = data.inviteId || `department_invite_${Date.now()}`;

            const inviteData = {
                roomId: roomId,
                fromDepartmentId: currentDepartmentId,
                targetDepartmentId: data.targetDepartmentId,
                inviteReason: data.reason || 'Manual invite',
                timestamp: new Date(),
                workspaceId: workspaceId,
                requestingAgentSocketId: client.id, // Track requesting agent's socket ID
            }

            await this.redis.set(
                `department_invite:${inviteId}`,
                JSON.stringify(inviteData)
            );

            // Get room details
            const room = await this.chatService.getRoomById(roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'PENDING_INVITE');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.PENDING_INVITE);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, data.targetDepartmentId);
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

            // Send acknowledgment to the inviting agent
            client.emit('invitation-sent', {
                roomId: roomId,
                targetDepartmentId: data.targetDepartmentId,
                timestamp: new Date(),
                inviteId: inviteId,
            });

            // Notify department room about incoming invitation
            this.server.to(`workspace:${workspaceId}:${data.targetDepartmentId}`).emit('new-invitation', {
                roomId: roomId,
                fromDepartmentId: currentDepartmentId,
                inviteReason: data.reason || 'Manual invite',
                timestamp: new Date(),
                workspaceId: workspaceId,
                inviteId: inviteId,
            });

            this.logger.log(`Department invite sent: ${currentDepartmentId} invited department ${data.targetDepartmentId} to room ${roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error inviting department to chat: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to invite department to chat',
                'INVITATION_ERROR',
                { error: error.message }
            );
        }
    }

    // Accept Invitation to Chat (Inter-Department)
    @SubscribeMessage('accept-department-invitation-to-chat')
    async handleAcceptDepartmentInvitationToChat(@ConnectedSocket() client: Socket, @MessageBody() data: DepartmentInvitationAcceptOrReject) {

        const { agentId, workspaceId, authenticated, currentDepartmentId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to accept department invitation to chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !currentDepartmentId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, currentDepartmentId }
            );
            client.disconnect(true);
            return;
        }

        try {

            if (!data.inviteId || !data.roomId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invite ID and room ID are required',
                    'INVALID_INVITE_DATA',
                    { inviteId: data.inviteId, roomId: data.roomId }
                );
                return;
            }

            const inviteKey = `department_invite:${data.inviteId}`;
            const invite = await this.redis.get(inviteKey);

            if (!invite) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invite not found or has expired',
                    'INVALID_INVITE',
                    { inviteId: data.inviteId }
                );
                return;
            }

            const inviteData = JSON.parse(invite);

            if (inviteData.targetDepartmentId !== currentDepartmentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this invitation',
                    'UNAUTHORIZED_INVITATION_ACCEPTANCE',
                    { inviteId: data.inviteId, intendedTarget: inviteData.targetDepartmentId, acceptingAgent: currentDepartmentId }
                );
                return;
            }

            // Remove the invite from Redis since it's been accepted
            await this.redis.del(inviteKey);

            // Accept the invite
            await this.chatService.handleAcceptDepartmentInvitation(agentId, currentDepartmentId, data.roomId, workspaceId);

            // Update agent status to BUSY since they're now handling the chat
            await this.agentService.updateAgentStatus(agentId, workspaceId, {
                status: 'BUSY',
                currentRoomId: data.roomId,
            });

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, inviteData.targetDepartmentId);
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

            // Join the room
            await client.join(`room:${data.roomId}`);

            // Leave the view room
            await client.leave(`room_view:${data.roomId}`);

            // Notify room about agent joining
            this.server.to(`room:${data.roomId}`).except(client.id).emit('agent-joined', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify room view about agent joining
            this.server.to(`room_view:${data.roomId}`).emit('agent-joined', {
                roomId: data.roomId,
                agentId: agentId,
                agentName: client.data.user.name,
                joinedAt: new Date(),
                status: 'ACTIVE',
                lastSeenAt: new Date(),
            });

            // Notify the agent about the acceptance
            client.emit('invitation-accepted', {
                roomId: data.roomId,
                inviteId: data.inviteId,
                acceptedAt: new Date(),
            });

            this.logger.log(`Department invitation accepted: ${currentDepartmentId} accepted invitation ${data.inviteId} for room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error accepting department invitation to chat: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to accept department invitation to chat',
                'INVITATION_ACCEPTANCE_ERROR',
                { error: error.message }
            );
            client.disconnect(true);
        }
    }

    // Reject Invitation to Chat (Inter-Department)
    @SubscribeMessage('reject-department-invitation-to-chat')
    async handleRejectDepartmentInvitationToChat(@ConnectedSocket() client: Socket, @MessageBody() data: DepartmentInvitationAcceptOrReject) {

        const { agentId, workspaceId, authenticated, currentDepartmentId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to reject department invitation to chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!agentId || !workspaceId || !currentDepartmentId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { agentId, workspaceId, currentDepartmentId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.inviteId || !data.roomId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invite ID and room ID are required',
                'INVALID_INVITE_DATA',
                { inviteId: data.inviteId, roomId: data.roomId }
            );
            return;
        }

        try {
            const inviteKey = `department_invite:${data.inviteId}`;
            const invite = await this.redis.get(inviteKey);

            if (!invite) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invite not found or has expired',
                    'INVALID_INVITE',
                    { inviteId: data.inviteId }
                );
                return;
            }

            const inviteData = JSON.parse(invite);

            if (inviteData.targetDepartmentId !== currentDepartmentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'You are not the intended recipient of this invitation',
                    'UNAUTHORIZED_INVITATION_REJECTION',
                    { inviteId: data.inviteId, intendedTarget: inviteData.targetDepartmentId, rejectingAgent: currentDepartmentId }
                );
                return;
            }

            // Remove the invite from Redis since it's been rejected
            await this.redis.del(inviteKey);

            // Reject the invite
            await this.chatService.handleRejectDepartmentInvitation(agentId, currentDepartmentId, data.roomId, workspaceId);

            // Get room details
            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.logger.error(`Room ${data.roomId} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: data.roomId, workspaceId }
                );
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(room.visitorSessionId, 'CURRENTLY_SERVED');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(room.visitorSessionId, SessionStatus.CURRENTLY_SERVED);

            // Update visitor queues in workspace in respective departments
            await this.updateVisitorQueuesForClient(client, workspaceId, inviteData.fromDepartmentId);
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

            // Send acknowledgment to the rejecting agent
            client.emit('invitation-rejected', {
                roomId: data.roomId,
                inviteId: data.inviteId,
                rejectedAt: new Date(),
            });

            this.logger.log(`Department invitation rejected: ${currentDepartmentId} rejected invitation ${data.inviteId} for room ${data.roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error rejecting department invitation to chat: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to reject department invitation to chat',
                'INVITATION_REJECTION_ERROR',
                { error: error.message }
            );
            client.disconnect(true);
        }
    }

    // Get Past Chats
    @SubscribeMessage('get-past-chats')
    async handleGetPastChats(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorPastChats) {

        const { authenticated, workspaceId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to get past chats',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.visitorId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Visitor ID is required',
                'INVALID_VISITOR_ID'
            );
            return;
        }

        try {

            const pastChats = await this.chatService.getVisitorInactiveRooms(data.visitorId, workspaceId);

            client.emit('past-chats', {
                pastChats: pastChats
            });

            this.logger.log(`Past chats fetched for visitor: ${data.visitorId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error getting past chats: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to get past chats',
                'PAST_CHATS_ERROR',
                { error: error.message }
            );
        }
    }

    // Assign Tag to Chat
    @SubscribeMessage('agent-assign-tag-to-chat')
    async handleAssignTagToChat(@ConnectedSocket() client: Socket, @MessageBody() data: AgentChatTag) {

        const { authenticated, workspaceId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to assign tag to chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.roomId || !data.tagId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Room ID and tag ID are required',
                'INVALID_ROOM_OR_TAG'
            );
            return;
        }

        try {

            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND'
                );
                return;
            }

            const tag = await this.tagService.getTagById(data.tagId);
            const chatAssignment = await this.tagService.assignTagToChat(data.roomId, data.tagId, client.data.user.id);

            this.server.to(`room:${data.roomId}:internal`).emit('tag-assigned-to-chat', {
                roomId: data.roomId,
                tag: {
                    id: data.tagId,
                    name: tag.name,
                    color: tag.color,
                },
                assignedBy: chatAssignment.assignedByUser,
                assignedAt: chatAssignment.assignedAt,
            });

            this.server.to(`room_view:${data.roomId}`).emit('tag-assigned-to-chat', {
                roomId: data.roomId,
                tag: {
                    id: data.tagId,
                    name: tag.name,
                    color: tag.color,
                },
                assignedBy: chatAssignment.assignedByUser,
                assignedAt: chatAssignment.assignedAt,
            });

            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            this.logger.log(`Tag assigned to chat: ${data.roomId} in workspace: ${workspaceId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error assigning tag to chat: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to assign tag to chat',
                'ASSIGN_TAG_ERROR',
                { error: error.message }
            );
        }
    }

    // Unassign Tag from Chat
    @SubscribeMessage('unassign-tag-from-chat')
    async handleUnassignTagFromChat(@ConnectedSocket() client: Socket, @MessageBody() data: AgentChatTag) {

        const { authenticated, workspaceId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to unassign tag from chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.roomId || !data.tagId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Room ID and tag ID are required',
                'INVALID_ROOM_OR_TAG',
                { roomId: data.roomId, tagId: data.tagId },
            );
            return;
        }

        try {

            const room = await this.chatService.getRoomById(data.roomId, workspaceId);

            if (!room) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND'
                );
                return;
            }

            const tag = await this.tagService.getTagById(data.tagId);
            const chatAssignment = await this.tagService.unassignTagFromChat(data.roomId, data.tagId, client.data.user.id);

            this.server.to(`room:${data.roomId}:internal`).emit('tag-unassigned-from-chat', {
                roomId: data.roomId,
                tag: {
                    id: data.tagId,
                    name: tag.name,
                    color: tag.color,
                },
                unassignedBy: chatAssignment.removedByUser,
                unassignedAt: chatAssignment.removedAt,
            });

            this.server.to(`room_view:${data.roomId}`).emit('tag-unassigned-from-chat', {
                roomId: data.roomId,
                tag: {
                    id: data.tagId,
                    name: tag.name,
                    color: tag.color,
                },
                unassignedBy: chatAssignment.removedByUser,
                unassignedAt: chatAssignment.removedAt,
            });

            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            this.logger.log(`Tag unassigned from chat: ${data.roomId} in workspace: ${workspaceId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error unassigning tag from chat: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to unassign tag from chat',
                'UNASSIGN_TAG_ERROR',
                { error: error.message }
            );
        }
    }

    // Set Canned Response Usage
    @SubscribeMessage('use-canned-response')
    async handleUseCannedResponse(@ConnectedSocket() client: Socket, @MessageBody() data: CannedResponseUsage) {

        const { authenticated, workspaceId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to use canned response',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.roomId || !data.cannedResponseId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Room ID and canned response ID are required',
                'INVALID_ROOM_OR_CANNED_RESPONSE'
            );
            client.disconnect(true);
            return;
        }

        try {

            const cannedResponse = await this.cannedResponseService.setCannedResponseUsage(data.roomId, client.data.user.id, data.cannedResponseId, workspaceId);

            client.emit('canned-response-used', {
                roomId: data.roomId,
                cannedResponseId: data.cannedResponseId,
                usageCount: cannedResponse.usageCount,
                usedAt: cannedResponse.usedAt,
            });

            this.logger.log(`Canned response used: ${data.cannedResponseId} in workspace: ${workspaceId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error using canned response: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to use canned response',
                'USE_CANNED_RESPONSE_ERROR',
                { error: error.message }
            );
        }
    }

    // ===========================================================
    // CHAT WIDGET SOCKET EVENT HANDLERS
    // ===========================================================

    // Send Visitor Message to Chat Room
    @SubscribeMessage('visitor-message')
    async handleVisitorMessage(@ConnectedSocket() client: Socket, @MessageBody() data: ClientMessage) {

        const { sessionId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to send messages',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!sessionId || !workspaceId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { sessionId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        try {

            const id = roomId || data.roomId;

            if (!id) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room ID is required. Please refresh the page',
                    'INVALID_ROOM',
                    { roomId: id }
                );
                return;
            }

            // Validate message content
            if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Message content is required and cannot be empty or invalid',
                    'INVALID_MESSAGE',
                    { sessionId, workspaceId, roomId, messageId: data.messageId }
                )
                return;
            }

            // Create message using the service
            const createdMessage = await this.chatService.createMessage(
                data.messageId,
                id,
                'visitor',
                data.message.trim(),
                false, // isInternal = false for visitor messages
                sessionId,
                undefined,
                workspaceId
            );

            // Update chat start status
            await this.visitorService.visitorChatStarted(client.data.visitorId, sessionId, id, workspaceId);

            // Add message to tracking
            const visitorSockets = (await this.connectionTrackingService.getSessionConnections(sessionId))?.socketIds || client.id;
            const recipients = await this.server.to(`room:${roomId}`).except(visitorSockets).fetchSockets();
            const recipientIds = [...new Set(
                recipients.map(r => r.data.userType === 'agent' ? r.data.agentId : r.data.sessionId)
            )];

            const trackedMessage: TrackedMessage = {
                messageId: createdMessage.id,
                roomId: id,
                content: data.message.trim(),
                senderType: 'visitor',
                senderId: sessionId,
                recipients: recipientIds,
                createdAt: createdMessage.createdAt,
                workspaceId: workspaceId,
                senderName: client.data.visitor?.name,
            };

            await this.messageTrackingService.addMessage(id, trackedMessage);

            // Send acknowledgment back to visitor
            client.emit('message-ack', {
                roomId: id,
                messageId: data.messageId,
                status: 'sent',
                senderType: 'visitor',
                senderId: sessionId,
                senderName: client.data.visitor?.name,
                sentAt: createdMessage.createdAt
            });

            // Get room details
            const room = await this.chatService.getRoomById(id, workspaceId);

            if (!room) {
                this.logger.error(`Room ${id} not found in workspace ${workspaceId}`, 'ChatGateway');
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room not found',
                    'ROOM_NOT_FOUND',
                    { roomId: id, workspaceId }
                );
                return;
            }

            if (!room.primaryAgent) {
                await this.visitorService.updateSessionStatus(sessionId, 'INCOMING');

                await this.connectionTrackingService.updateSessionStatus(sessionId, SessionStatus.INCOMING);

                const viewingAgents = await this.server.to(`room_view:${id}`).fetchSockets();

                if (client.data.currentDepartmentId) {
                    this.server.to(`workspace:${workspaceId}:${client.data.currentDepartmentId}`).except(viewingAgents.map(a => a.id)).emit('new-message', {
                        messageId: createdMessage.id,
                        roomId: id,
                        content: data.message.trim(),
                        senderId: sessionId,
                        senderType: 'visitor',
                        senderName: client.data.visitor?.name,
                        sentAt: createdMessage.createdAt,
                        workspaceId
                    });
                } else {
                    this.server.to(`workspace:${workspaceId}`).except(viewingAgents.map(a => a.id)).emit('new-message', {
                        messageId: createdMessage.id,
                        roomId: id,
                        content: data.message.trim(),
                        senderId: sessionId,
                        senderType: 'visitor',
                        senderName: client.data.visitor?.name,
                        sentAt: createdMessage.createdAt,
                        workspaceId
                    });
                }
            }

            // Notify agents in the room about the new message
            this.server.to(`room:${id}`).except(client.id).emit('new-message', {
                messageId: createdMessage.id,
                roomId: id,
                content: data.message.trim(),
                senderId: sessionId,
                senderType: 'visitor',
                senderName: client.data.visitor?.name,
                sentAt: createdMessage.createdAt,
                workspaceId
            });

            // Notify room view about the new message
            this.server.to(`room_view:${id}`).emit('new-message', {
                messageId: createdMessage.id,
                roomId: id,
                content: data.message.trim(),
                senderType: 'visitor',
                senderId: sessionId,
                senderName: client.data.visitor?.name,
                sentAt: createdMessage.createdAt,
                workspaceId
            });

            // Update visitor queues in workspace in respective department
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            this.logger.log(`Visitor message processed for session: ${sessionId} in room: ${id}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing visitor message: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to process message. Please try again.',
                'MESSAGE_PROCESSING_ERROR',
                { error: error.message }
            );
        }
    }

    // Set Visitor To ACTIVE
    @SubscribeMessage('visitor-active')
    async handleVisitorActive(@ConnectedSocket() client: Socket) {

        const { sessionId, visitorId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to set visitor to active',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId || !visitorId || !sessionId || !roomId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        try {

            // Check if visitor is IDLE
            const currentStatus = await this.connectionTrackingService.getSessionConnections(sessionId);

            if (currentStatus && currentStatus.status === SessionStatus.IDLE) {
                // Check what is the status of the visitor session in the DB
                const visitorSession = await this.visitorService.getVisitorSessionById(sessionId);

                if (visitorSession && (visitorSession.status === SessionStatus.CURRENTLY_SERVED || visitorSession.status === SessionStatus.INCOMING || visitorSession.status === SessionStatus.PENDING_INVITE || visitorSession.status === SessionStatus.PENDING_TRANSFER)) {
                    // Update connection data to db status
                    await this.connectionTrackingService.updateSessionStatus(sessionId, visitorSession.status);
                    this.logger.log(`Visitor set to ${visitorSession.status}: ${sessionId} in room: ${roomId}`, 'ChatGateway');
                } else {
                    await this.visitorService.updateSessionStatus(sessionId, 'ACTIVE');
                    await this.connectionTrackingService.updateSessionStatus(sessionId, SessionStatus.ACTIVE);
                    this.logger.log(`Visitor set to active: ${sessionId} in room: ${roomId}`, 'ChatGateway');
                }
            }

        } catch (error) {
            this.logger.error(`Error setting visitor to active: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to set visitor to active',
                'VISITOR_ACTIVE_ERROR',
                { error: error.message }
            );
        }
    }

    // Set Visitor To IDLE
    @SubscribeMessage('visitor-idle')
    async handleVisitorIdle(@ConnectedSocket() client: Socket) {

        const { sessionId, visitorId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to set visitor to idle',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId || !visitorId || !sessionId || !roomId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        try {

            // Get current visitor status
            const currentStatus = await this.connectionTrackingService.getSessionConnections(sessionId);

            if (currentStatus && (currentStatus.status === SessionStatus.CURRENTLY_SERVED || currentStatus.status === SessionStatus.INCOMING || currentStatus.status === SessionStatus.PENDING_INVITE || currentStatus.status === SessionStatus.PENDING_TRANSFER)) {

                // TODO: Add an IDLE tag to the chatroom in these cases

                // Update visitor session status in connections
                await this.connectionTrackingService.updateSessionStatus(sessionId, SessionStatus.IDLE);
                this.logger.log(`Visitor set to idle: ${sessionId} in room: ${roomId}`, 'ChatGateway');
                return;
            }

            // Update visitor session status
            await this.visitorService.updateSessionStatus(sessionId, 'IDLE');

            // Update visitor session status in connections
            await this.connectionTrackingService.updateSessionStatus(sessionId, SessionStatus.IDLE);

            // Update visitor queues in workspace in respective department
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            this.logger.log(`Visitor set to idle: ${sessionId} in room: ${roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error setting visitor to idle: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to set visitor to idle',
                'VISITOR_IDLE_ERROR',
                { error: error.message }
            );
        }
    }

    // Set Visitor To AWAY
    @SubscribeMessage('visitor-away')
    async handleVisitorAway(@ConnectedSocket() client: Socket) {

        const { sessionId, visitorId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to set visitor to away',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId || !visitorId || !sessionId || !roomId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        try {
            // Update visitor session status
            await this.visitorService.endVisitorSession(sessionId);

            // Remove the visitor from session connections
            await this.connectionTrackingService.removeSessionConnectionData(sessionId);

            // Update visitor queues in workspace in respective department
            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            client.disconnect(true);

            this.logger.log(`Visitor set to away: ${sessionId} in room: ${roomId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error setting visitor to away: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to set visitor to away',
                'VISITOR_AWAY_ERROR',
                { error: error.message }
            );
        }
    }

    // Visitor Page Tracking
    @SubscribeMessage('track-visitor-page')
    async handleVisitorPageChanged(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorPageChanged) {

        const { sessionId, visitorId, workspaceId, authenticated, roomId, currentDepartmentId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to track visitor page',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId || !visitorId || !sessionId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId: workspaceId, visitorId: visitorId, sessionId: sessionId }
            );
            client.disconnect(true);
            return;
        }

        try {
            // Track visitor page activity
            const result = await this.visitorService.trackVisitorPage(sessionId, visitorId, workspaceId, data);

            if (!result) {
                return;
            }

            // Emit success response to client
            client.emit('visitor-page-tracked', {
                success: true,
                message: 'Visitor page tracked successfully'
            });

            // Update the agents about the page change
            this.server.to(`room:${roomId}`).emit('visitor-page-changed', {
                visitorId: visitorId,
                roomId: roomId,
                visitorName: client.data.visitor?.name,
                trackingData: {
                    pageTracking: result.pageTracking,
                    currentPage: result.currentPage
                }
            });

            // Update the viewing agents about the page change
            this.server.to(`room_view:${roomId}`).emit('visitor-page-changed', {
                visitorId: visitorId,
                roomId: roomId,
                visitorName: client.data.visitor?.name,
                trackingData: {
                    pageTracking: result.pageTracking,
                    currentPage: result.currentPage
                }
            });

            // Update the queues to display new changes
            await this.updateVisitorQueuesForClient(client, workspaceId, currentDepartmentId);

        } catch (error) {
            this.logger.error(`Error processing visitor page changed: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to track visitor page',
                'VISITOR_PAGE_CHANGED_ERROR',
                { error: error.message }
            );
        }
    }

    // Assign Tag to Chat
    @SubscribeMessage('visitor-assign-tag-to-chat')
    async handleVisitorAssignTagToChat(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorChatTag) {

        const { sessionId, visitorId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to assign tag to chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId || !visitorId || !sessionId || !roomId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId: workspaceId, visitorId: visitorId, sessionId: sessionId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.tagNames) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Tag names are required',
                'INVALID_TAG',
            );
            client.disconnect(true);
            return;
        }

        try {

            let tags: any[] = [];

            for (const tagName of data.tagNames) {
                let tag: any;
                try {
                    tag = await this.tagService.createTag(workspaceId, { name: tagName, color: '#e5e7eb', isSystem: true }, undefined, sessionId);
                } catch (error) {
                    continue;
                }
                const tagAssignment = await this.tagService.assignTagToChat(roomId, tag.id, undefined, sessionId);
                tags.push({ tag, tagAssignment });
            }

            this.server.to(`room:${roomId}:internal`).emit('tag-assigned-to-chat', {
                roomId: roomId,
                tags: tags.map(t => ({
                    id: t.tag.id,
                    name: t.tag.name,
                    color: t.tag.color,
                    assignedBy: t.tagAssignment.assignedByVisitor,
                    assignedAt: t.tagAssignment.assignedAt,
                })),
            });

            this.server.to(`room_view:${roomId}`).emit('tag-assigned-to-chat', {
                roomId: roomId,
                tags: tags.map(t => ({
                    id: t.tag.id,
                    name: t.tag.name,
                    color: t.tag.color,
                    assignedBy: t.tagAssignment.assignedByVisitor,
                    assignedAt: t.tagAssignment.assignedAt,
                })),
            });

            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            this.logger.log(`Tag assigned to chat: ${roomId} in workspace: ${workspaceId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error assigning tag to chat: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to assign tag to chat',
                'ASSIGN_TAG_ERROR',
                { error: error.message }
            );
        }
    }

    // Unassign Tag from Chat
    @SubscribeMessage('visitor-unassign-tag-from-chat')
    async handleVisitorUnassignTagFromChat(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorChatTag) {
        const { sessionId, visitorId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to assign tag to chat',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId || !visitorId || !sessionId || !roomId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId: workspaceId, visitorId: visitorId, sessionId: sessionId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.tagNames) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Tag names are required',
                'INVALID_TAG',
            );
            client.disconnect(true);
            return;
        }

        try {

            let tags: any[] = [];

            for (const tagName of data.tagNames) {
                const tagAssignment = await this.tagService.visitorUnassignTagFromChat(roomId, tagName, sessionId);
                tags.push({ tagAssignment });
            }

            this.server.to(`room:${roomId}:internal`).emit('tag-unassigned-from-chat', {
                roomId: roomId,
                tags: tags.map(t => ({
                    id: t.tagAssignment.tagId,
                    name: t.tagAssignment.tag.name,
                    color: t.tagAssignment.tag.color,
                    unassignedBy: t.tagAssignment.removedByVisitor,
                    unassignedAt: t.tagAssignment.removedAt,
                })),
            });

            this.server.to(`room_view:${roomId}`).emit('tag-unassigned-from-chat', {
                roomId: roomId,
                tags: tags.map(t => ({
                    id: t.tagAssignment.tagId,
                    name: t.tagAssignment.tag.name,
                    color: t.tagAssignment.tag.color,
                    unassignedBy: t.tagAssignment.removedByVisitor,
                    unassignedAt: t.tagAssignment.removedAt,
                })),
            });

            await this.updateVisitorQueuesForClient(client, workspaceId, client.data.currentDepartmentId);

            this.logger.log(`Tag unassigned from chat: ${roomId} in workspace: ${workspaceId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error unassigning tag from chat: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to unassign tag from chat',
                'UNASSIGN_TAG_ERROR',
                { error: error.message }
            );
        }
    }

    // Post Chat Form
    @SubscribeMessage('visitor-post-chat-form')
    async handleVisitorPostChatForm(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorPostChatForm) {

        const { sessionId, visitorId, workspaceId, authenticated, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to send post chat form',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId || !visitorId || !sessionId || !roomId || !this.connectionTrackingService.hasSession(sessionId)) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
                { workspaceId: workspaceId, visitorId: visitorId, sessionId: sessionId }
            );
            client.disconnect(true);
            return;
        }

        if (!data.rating && !data.feedback) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Rating or feedback is required',
                'INVALID_FORM'
            );
            client.disconnect(true);
            return;
        }

        try {

            const updatedVisitor = await this.visitorService.visitorPostChatForm(visitorId, workspaceId, data.rating, data.feedback);

            this.server.to(`room:${roomId}:internal`).emit('visitor-post-chat-form', {
                roomId: roomId,
                visitor: {
                    id: updatedVisitor.id,
                    name: updatedVisitor.name,
                    email: updatedVisitor.email,
                    phone: updatedVisitor.phone,
                    notes: updatedVisitor.notes,
                },
                rating: data.rating,
                feedback: data.feedback,
            });

            this.server.to(`room_view:${roomId}`).emit('visitor-post-chat-form', {
                roomId: roomId,
                visitor: {
                    id: updatedVisitor.id,
                    name: updatedVisitor.name,
                    email: updatedVisitor.email,
                    phone: updatedVisitor.phone,
                    notes: updatedVisitor.notes,
                },
                rating: data.rating,
                feedback: data.feedback,
            });

            this.logger.log(`Visitor post chat form updated: ${visitorId} in workspace: ${workspaceId}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing post chat form: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to process post chat form',
                'POST_CHAT_FORM_ERROR',
                { error: error.message }
            );
        }
    }

    // ===========================================================
    // GLOBAL SOCKET EVENT HANDLERS
    // ===========================================================

    // Agent or Visitor Typing Indicator
    @SubscribeMessage('client-typing')
    async handleVisitorTyping(@ConnectedSocket() client: Socket, @MessageBody() data: ClientTyping) {

        const { visitorId, agentId, workspaceId, authenticated, roomId, sessionId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to send typing indicators',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        let clientId: string;

        if (client.data.userType === 'visitor' && visitorId) {
            clientId = visitorId;

            if (!visitorId || !roomId || !sessionId || !this.connectionTrackingService.hasSession(sessionId)) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid session data. Please create a new session.',
                    'INVALID_SESSION',
                    { visitorId, workspaceId, roomId }
                );
                client.disconnect(true);
                return;
            }

        } else if (client.data.userType === 'agent' && agentId) {
            clientId = agentId;

            if (!agentId) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Invalid session data. Please create a new session.',
                    'INVALID_SESSION',
                    { agentId, workspaceId }
                );
                client.disconnect(true);
                return;
            }
        } else {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please create a new session.',
                'INVALID_SESSION',
                { agentId, workspaceId }
            );
            client.disconnect(true);
            return;
        }

        try {

            const id = roomId || data.roomId;

            if (!id) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room ID is required. Please refresh the page',
                    'INVALID_ROOM',
                    { roomId: id }
                );
                return;
            }

            // Send typing indicator to everyone in the room EXCEPT the typer
            this.server.to(`room:${id}`).except(client.id).emit('typing-indicator', {
                roomId: id,
                clientId: clientId || '',
                clientType: client.data.userType,
                clientName: client.data.userType === 'visitor' ? 'Visitor' : client.data.user.name,
                isTyping: data.isTyping,
                timestamp: new Date()
            });

            // Notify room view about the typing indicator
            this.server.to(`room_view:${id}`).emit('typing-indicator', {
                roomId: id,
                clientId: clientId || '',
                clientType: client.data.userType,
                clientName: client.data.userType === 'visitor' ? 'Visitor' : client.data.user.name,
                isTyping: data.isTyping,
                timestamp: new Date()
            });

            this.logger.log(`Typing status updated: ${clientId || ''} in room ${id} - ${data.isTyping ? 'typing' : 'stopped typing'}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error handling typing indicator: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to send typing indicator',
                'TYPING_ERROR',
                { error: error.message }
            );
        }
    }

    // Agent or Visitor Read Receipt
    @SubscribeMessage('read-receipt')
    async handleReadReceipt(@ConnectedSocket() client: Socket, @MessageBody() data: MessageReadOrDeliveredRequest) {
        const { authenticated, roomId, workspaceId, sessionId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to send read receipts',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (client.data.userType === 'visitor' && (!sessionId || !this.connectionTrackingService.hasSession(sessionId))) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Message data is required and must be a non-empty array',
                'INVALID_MESSAGE_DATA',
                { messageIds: data.messages }
            );
            return;
        }

        try {
            const id = roomId || data.roomId;

            if (!id) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room ID is required. Please refresh the page',
                    'INVALID_ROOM',
                    { roomId: id }
                );
                return;
            }

            const ids = new Set(data.messages.map(m => m.messageId));
            const tracking = await this.messageTrackingService.getMessages(id);
            const messages = tracking?.messages.filter(m => ids.has(m.messageId)) ?? [];

            if (!messages || messages.length !== data.messages.length) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Messages not found, or are already read.',
                    'INVALID_MESSAGE_DATA',
                    { messageIds: data.messages }
                );
                return;
            }

            const messageIntendedToReceipient = messages.filter(m => m.recipients.includes(client.data.userType === 'visitor' ? client.data.sessionId : client.data.agentId));

            let recipients: any[] = [];
            if (messageIntendedToReceipient.length === 0) {
                for (const message of data.messages) {
                    const visitorSenderSockets = await this.connectionTrackingService.getSessionConnections(message.senderId);
                    const agentSenderSockets = await this.connectionTrackingService.getAgentConnections(message.senderId, workspaceId);
                    const senderSockets = visitorSenderSockets ? visitorSenderSockets.socketIds : agentSenderSockets ? agentSenderSockets.socketIds : [];
                    recipients = await this.server.to(`room:${id}`).except(senderSockets).fetchSockets();
                    const recipientIds = recipients.map(r => r.data.userType === 'visitor' ? r.data.sessionId : r.data.agentId);

                    if (recipientIds.includes(client.data.userType === 'visitor' ? client.data.sessionId : client.data.agentId)) {
                        messageIntendedToReceipient.push(messages.find(m => m.messageId === message.messageId)!);
                    }
                }
            }

            if (recipients.length !== 0 && messageIntendedToReceipient.length !== data.messages.length) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Messages not intended for this recipient.',
                    'INVALID_MESSAGE_DATA',
                    { messageIds: data.messages }
                );
                return;
            }

            const messageIds = data.messages.map(m => m.messageId);
            const groupedMessages: any = {};

            for (const message of data.messages) {
                if (!groupedMessages[message.senderId]) {
                    groupedMessages[message.senderId] = [];
                }
                groupedMessages[message.senderId].push(message.messageId);
            }

            // Mark specific messages as read
            const readStatus = await this.chatService.markMessagesAsRead(id, messageIds, client.id, client.data.agentId, client.data.sessionId);

            for (const senderId in groupedMessages) {

                const visitorSenderSockets = await this.connectionTrackingService.getSessionConnections(senderId);
                const agentSenderSockets = await this.connectionTrackingService.getAgentConnections(senderId, workspaceId);

                const senderSockets = visitorSenderSockets ? visitorSenderSockets.socketIds : agentSenderSockets ? agentSenderSockets.socketIds : [];

                if (senderSockets.length > 0) {
                    this.server.to(senderSockets).emit('messages-read', {
                        roomId: id,
                        messageIds: groupedMessages[senderId],
                        readBy: client.data.userType === 'visitor' ? `visitor - ${client.data.visitorId}` : `agent - ${client.data.user.name || client.data.agentId}`,
                        readAt: readStatus.readAt,
                    });
                }

                // Notify room view about the read receipts
                this.server.to(`room_view:${id}`).emit('messages-read', {
                    roomId: id,
                    messageIds: groupedMessages[senderId],
                    readBy: client.data.userType === 'visitor' ? `visitor - ${client.data.visitorId}` : `agent - ${client.data.user.name || client.data.agentId}`,
                    readAt: readStatus.readAt,
                });
            }

            this.logger.log(`Read receipts sent. Marked ${messageIds.length} messages as read in room ${id}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing read receipts: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to mark messages as read',
                'READ_RECEIPT_ERROR',
                { error: error.message }
            );
        }
    }

    // Agent or Visitor message delivered
    @SubscribeMessage('message-delivered')
    async handleMessageDelivered(@ConnectedSocket() client: Socket, @MessageBody() data: MessageReadOrDeliveredRequest) {
        const { authenticated, roomId, workspaceId, sessionId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(
                client,
                'AUTHENTICATION_ERROR',
                'Authentication required to send message delivered',
                'UNAUTHORIZED'
            );
            client.disconnect(true);
            return;
        }

        if (client.data.userType === 'visitor' && (!sessionId || !this.connectionTrackingService.hasSession(sessionId))) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Message data is required and must be a non-empty array',
                'INVALID_MESSAGE_DATA',
                { messageIds: data.messages }
            );
            return;
        }

        try {

            const id = roomId || data.roomId;

            if (!id) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Room ID is required. Please refresh the page',
                    'INVALID_ROOM',
                    { roomId: id }
                );
                return;
            }

            const ids = new Set(data.messages.map(m => m.messageId));
            const tracking = await this.messageTrackingService.getMessages(id);
            const messages = tracking?.messages.filter(m => ids.has(m.messageId)) ?? [];

            if (!messages || messages.length !== data.messages.length) {
                this.sendErrorResponse(
                    client,
                    'SYSTEM_ERROR',
                    'Messages not found, or are already delivered.',
                    'INVALID_MESSAGE_DATA',
                    { messageIds: data.messages }
                );
                return;
            }

            const messageIntendedToReceipient = messages.filter(m => m.recipients.includes(client.data.userType === 'visitor' ? client.data.sessionId : client.data.agentId));

            let recipients: any[] = [];
            if (messageIntendedToReceipient.length === 0) {
                for (const message of data.messages) {
                    const visitorSenderSockets = await this.connectionTrackingService.getSessionConnections(message.senderId);
                    const agentSenderSockets = await this.connectionTrackingService.getAgentConnections(message.senderId, workspaceId);
                    const senderSockets = visitorSenderSockets ? visitorSenderSockets.socketIds : agentSenderSockets ? agentSenderSockets.socketIds : [];
                    recipients = await this.server.to(`room:${id}`).except(senderSockets).fetchSockets();
                    const recipientIds = recipients.map(r => r.data.userType === 'visitor' ? r.data.sessionId : r.data.agentId);

                    if (recipientIds.includes(client.data.userType === 'visitor' ? client.data.sessionId : client.data.agentId)) {
                        messageIntendedToReceipient.push(messages.find(m => m.messageId === message.messageId)!);
                    }
                }
            }

            if (recipients.length !== 0 && messageIntendedToReceipient.length !== data.messages.length) {
                this.sendErrorResponse(
                    client,
                    'VALIDATION_ERROR',
                    'Message not intended for this recipient. Please refresh the page.',
                    'INVALID_MESSAGE_DATA',
                    { messageIds: data.messages }
                );
                return;
            }

            // Mark messages as delivered to the room
            for (const message of data.messages) {
                await this.chatService.markMessageAsDelivered(message.messageId, id, client.id);
            }

            // Mark messages as delivered in tracking
            await this.messageTrackingService.markMessagesAsDelivered(id, data.messages.map(m => m.messageId), client.data.userType === 'visitor' ? client.data.sessionId : client.data.agentId);

            for (const message of data.messages) {

                const visitorSenderSockets = await this.connectionTrackingService.getSessionConnections(message.senderId);
                const agentSenderSockets = await this.connectionTrackingService.getAgentConnections(message.senderId, workspaceId);

                const senderSockets = visitorSenderSockets ? visitorSenderSockets.socketIds : agentSenderSockets ? agentSenderSockets.socketIds : [];

                if (senderSockets.length > 0) {
                    this.server.to(senderSockets).emit('delivered-to', {
                        messageId: message.messageId,
                        roomId: id,
                        deliveredTo: client.data.userType === 'visitor' ? `visitor - ${client.data.sessionId}` : `agent - ${client.data.user.name}`,
                        deliveredAt: new Date(),
                    });
                }

                // Notify room view about the message delivered
                this.server.to(`room_view:${id}`).emit('delivered-to', {
                    messageId: message.messageId,
                    roomId: id,
                    deliveredTo: client.data.userType === 'visitor' ? `visitor - ${client.data.sessionId}` : `agent - ${client.data.user.name}`,
                    deliveredAt: new Date(),
                });

                this.logger.log(`Message delivered: ${message.messageId} to room ${id}`, 'ChatGateway');
            }

        } catch (error) {
            this.logger.error(`Error processing message delivered: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(
                client,
                'SYSTEM_ERROR',
                'Failed to mark message as delivered',
                'MESSAGE_DELIVERED_ERROR',
                { error: error.message }
            );
        }
    }

    // Agent or Visitor Send File Upload Status
    @SubscribeMessage('file-upload-status')
    async handleFileUploadStatus(@ConnectedSocket() client: Socket, @MessageBody() data: FileUploadStatus) {

        const { authenticated, sessionId, workspaceId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(client, 'AUTHENTICATION_ERROR', 'Authentication required to send file upload status', 'UNAUTHORIZED');
            client.disconnect(true);
            return;
        }

        if (client.data.userType === 'visitor' && (!sessionId || !this.connectionTrackingService.hasSession(sessionId))) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        try {

            const id = data.roomId || client.data.roomId;

            if (!id) {
                this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Room ID is required. Please refresh the page', 'INVALID_ROOM', { roomId: id });
                return;
            }

            const tracking = await this.messageTrackingService.getMessages(id);

            if (!tracking) {
                this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Room not found. Please refresh the page', 'INVALID_ROOM', { roomId: id });
                return;
            }

            const message = tracking.messages.find(m => m.messageId === data.messageId);

            if (!message) {
                this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Message not found. Please refresh the page', 'INVALID_MESSAGE', { messageId: data.messageId });
                return;
            }

            client.emit('upload-status', {
                roomId: id,
                messageId: data.messageId,
                uploadId: data.uploadId || null,
                status: data.status,
                progress: typeof data.progress === 'number' ? Math.max(0, Math.min(100, data.progress)) : undefined,
                errorCode: data.errorCode,
                errorMessage: data.errorMessage,
            });

            this.logger.log(`File upload status sent to room ${id}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error processing file upload status: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(client, 'SYSTEM_ERROR', 'Failed to process file upload status', 'FILE_UPLOAD_STATUS_ERROR', { error: error.message });
        }
    }

    // Agent or Visitor Send File Message to Chat Room
    @SubscribeMessage('file-message')
    async handleFileMessage(@ConnectedSocket() client: Socket, @MessageBody() data: FileMessage) {
        const { authenticated, workspaceId, agentId, sessionId, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(client, 'AUTHENTICATION_ERROR', 'Authentication required to send files', 'UNAUTHORIZED');
            client.disconnect(true);
            return;
        }

        if (client.data.userType === 'visitor' && (!sessionId || !this.connectionTrackingService.hasSession(sessionId))) {
            this.sendErrorResponse(
                client,
                'VALIDATION_ERROR',
                'Invalid session data. Please refresh the page.',
                'INVALID_SESSION',
            );
            client.disconnect(true);
            return;
        }

        const isVisitor = client.data.userType === 'visitor' && !!sessionId && this.connectionTrackingService.hasSession(sessionId);
        const isAgent = client.data.userType === 'agent' && !!agentId;

        if (!workspaceId || (!isVisitor && !isAgent)) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Invalid session data. Please refresh the page.', 'INVALID_SESSION');
            client.disconnect(true);
            return;
        }

        const id = roomId || data.roomId;
        if (!id) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Room ID is required. Please refresh the page', 'INVALID_ROOM', { roomId: id });
            return;
        }

        // Basic attachment validation
        if (!data.attachment || !data.attachment.url || !data.attachment.fileName || !data.attachment.mimeType || typeof data.attachment.size !== 'number') {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Invalid attachment data', 'INVALID_ATTACHMENT', { attachment: data.attachment });
            return;
        }

        try {
            // Persist file message
            const created = await this.chatService.createFileMessage(
                data.messageId,
                id,
                isAgent ? 'agent' : 'visitor',
                {
                    url: data.attachment.url,
                    fileName: data.attachment.fileName,
                    mimeType: data.attachment.mimeType,
                    size: data.attachment.size,
                    previewUrl: data.attachment.previewUrl,
                    width: data.attachment.width,
                    height: data.attachment.height,
                },
                data.caption || '',
                data.isInternal || false,
                isVisitor ? sessionId : undefined,
                isAgent ? agentId : undefined,
                workspaceId,
            );

            // Determine recipients similar to text messages
            let senderSockets: string[] | string = client.id;
            if (isAgent) {
                senderSockets = (await this.connectionTrackingService.getAgentConnections(agentId!, workspaceId))?.socketIds || client.id;
            } else if (isVisitor) {
                senderSockets = (await this.connectionTrackingService.getSessionConnections(sessionId!))?.socketIds || client.id;
            }

            const recipients = await this.server.to(`room:${id}`).except(senderSockets).fetchSockets();
            const recipientIds = [...new Set(
                recipients.map(r => r.data.userType === 'agent' ? r.data.agentId : r.data.sessionId)
            )];

            // Track message
            const tracked: TrackedMessage = {
                messageId: created.id,
                roomId: id,
                content: data.caption || '',
                senderType: isAgent ? 'agent' : 'visitor',
                senderId: isAgent ? agentId! : sessionId!,
                recipients: recipientIds,
                createdAt: created.createdAt,
                workspaceId: workspaceId,
                senderName: isAgent ? client.data.user.name : client.data.visitor?.name,
            };
            await this.messageTrackingService.addMessage(id, tracked);

            // Ack to sender
            client.emit('message-ack', {
                roomId: id,
                messageId: data.messageId,
                status: 'sent',
                senderType: isAgent ? 'agent' : 'visitor',
                senderId: isAgent ? agentId : sessionId,
                senderName: isAgent ? client.data.user.name : client.data.visitor?.name,
                messageType: 'file',
                attachment: data.attachment,
                caption: data.caption || '',
                uploadId: data.uploadId || null,
                sentAt: created.createdAt,
            });

            // Notify room participants (include uploadId so UIs can finalize placeholder)
            this.server.to(`room:${id}`).except(client.id).emit('new-message', {
                messageId: created.id,
                roomId: id,
                senderId: isAgent ? agentId : sessionId,
                senderType: isAgent ? 'agent' : 'visitor',
                senderName: isAgent ? client.data.user.name : client.data.visitor?.name,
                messageType: 'file',
                attachment: data.attachment,
                caption: data.caption || '',
                uploadId: data.uploadId || null,
                sentAt: created.createdAt,
                workspaceId,
            });

            // Also notify viewers
            this.server.to(`room_view:${id}`).emit('new-message', {
                messageId: created.id,
                roomId: id,
                senderId: isAgent ? agentId : sessionId,
                senderType: isAgent ? 'agent' : 'visitor',
                senderName: isAgent ? client.data.user.name : client.data.visitor?.name,
                messageType: 'file',
                attachment: data.attachment,
                caption: data.caption || '',
                uploadId: data.uploadId || null,
                sentAt: created.createdAt,
                workspaceId,
            });

            // Optionally broadcast that upload is completed (to finalize progress bars)
            this.server.to(`room:${id}`).emit('upload-status', {
                roomId: id,
                messageId: data.messageId,
                uploadId: data.uploadId || null,
                status: 'completed',
                progress: 100,
            });

            this.logger.log(`File message processed in room ${id}`, 'ChatGateway');
        } catch (error) {
            this.logger.error(`Error processing file message: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(client, 'SYSTEM_ERROR', 'Failed to process file message', 'FILE_MESSAGE_ERROR', { error: error.message });
        }
    }

    // Identify Visitor Details
    @SubscribeMessage('identify-visitor')
    async handleVisitorIdentity(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorIdentity) {

        const { authenticated, visitorId, workspaceId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(client, 'AUTHENTICATION_ERROR', 'Authentication required to identify visitor', 'UNAUTHORIZED');
            client.disconnect(true);
            return;
        }

        if (!workspaceId) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Invalid session data. Please refresh the page.', 'INVALID_SESSION');
            client.disconnect(true);
            return;
        }

        const id = visitorId || data.visitorId;

        if (!id) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Visitor ID is required', 'INVALID_VISITOR_ID');
            client.disconnect(true);
            return;
        }

        try {

            const updatedVisitor = await this.visitorService.visitorIdentify(id, workspaceId, data.name, data.email, data.phone, data.notes);

            client.emit('visitor-identified', {
                visitor: updatedVisitor,
            });

            this.server.to(`room:${client.data.roomId}:internal`).emit('visitor-identified', {
                visitor: updatedVisitor,
            });

            this.server.to(`room_view:${client.data.roomId}`).emit('visitor-identified', {
                visitor: updatedVisitor,
            });

            this.logger.log(`Visitor identified: ${data.visitorId}`, 'ChatGateway');
        } catch (error) {
            this.logger.error(`Error identifying visitor: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(client, 'SYSTEM_ERROR', 'Failed to identify visitor', 'IDENTIFY_VISITOR_ERROR', { error: error.message });
        }
    }

    // Get Messages (Paginated)
    @SubscribeMessage('get-messages')
    async handleGetMessages(@ConnectedSocket() client: Socket, @MessageBody() data: MessageHistory) {

        const { authenticated, workspaceId, agentId, sessionId, roomId } = client.data as ConnectionData;

        if (!authenticated) {
            this.sendErrorResponse(client, 'AUTHENTICATION_ERROR', 'Authentication required to get messages', 'UNAUTHORIZED');
            client.disconnect(true);
            return;
        }

        const isAgent = client.data.userType === 'agent' && !!agentId;
        const isVisitor = client.data.userType === 'visitor' && !!sessionId && this.connectionTrackingService.hasSession(sessionId);

        if (!workspaceId || (!isAgent && !isVisitor)) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Invalid session data. Please refresh the page.', 'INVALID_SESSION');
            client.disconnect(true);
            return;
        }

        const id = roomId || data.roomId;

        if (!id) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Room ID is required. Please refresh the page', 'INVALID_ROOM', { roomId: id });
            return;
        }

        if (data.page < 1) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Page number must be greater than 0', 'INVALID_PAGE', { page: data.page });
            return;
        }

        if (data.limit < 1) {
            this.sendErrorResponse(client, 'VALIDATION_ERROR', 'Limit must be greater than 0', 'INVALID_LIMIT', { limit: data.limit });
            return;
        }

        try {

            const messages = await this.chatService.getMessages(isAgent ? 'agent' : 'visitor', id, data.page, data.limit);

            client.emit('messages', {
                messages: messages.messages,
                total: messages.total,
                page: messages.page,
                limit: messages.limit,
            });

            this.logger.log(`Messages fetched for room ${id}`, 'ChatGateway');

        } catch (error) {
            this.logger.error(`Error getting messages: ${error.message}`, 'ChatGateway');
            this.sendErrorResponse(client, 'SYSTEM_ERROR', 'Failed to get messages', 'GET_MESSAGES_ERROR', { error: error.message });
        }
    }
}