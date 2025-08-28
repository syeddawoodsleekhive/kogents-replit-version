import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../../common/logger/app-logger.service';

export enum SessionStatus {
    ACTIVE = 'ACTIVE',
    AWAY = 'AWAY',
    IDLE = 'IDLE',
    INCOMING = 'INCOMING',
    CURRENTLY_SERVED = 'CURRENTLY_SERVED',
    PENDING_TRANSFER = 'PENDING_TRANSFER',
    PENDING_INVITE = 'PENDING_INVITE',
}

export enum AgentStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    BUSY = 'BUSY',
}

export interface ConnectionData {
    sessionId: string;
    userType: 'visitor' | 'agent';
    socketIds: string[];
    status: SessionStatus | AgentStatus;
    lastUpdated: Date;
    workspaceId?: string;
    userId?: string; // visitorId or agentId
}

export interface AgentConnectionData extends ConnectionData {
    userType: 'agent';
    status: AgentStatus;
    joinedRooms: string[]; // Track all rooms joined by the agent
    socketRooms: { [socketId: string]: string[] }; // Track rooms per socket
    totalRoomsJoined: number; // Total unique rooms across all connections
}

@Injectable()
export class ConnectionTrackingService {
    private readonly REDIS_KEY_PREFIX = 'session_connections';
    private readonly AGENT_REDIS_KEY_PREFIX = 'agent_connections';

    constructor(
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        private readonly logger: AppLoggerService,
    ) { }

    private getRedisKey(sessionId: string): string {
        return `${this.REDIS_KEY_PREFIX}:${sessionId}`;
    }

    private getAgentRedisKey(agentId: string, workspaceId: string): string {
        return `${this.AGENT_REDIS_KEY_PREFIX}:${agentId}:${workspaceId}`;
    }

    /**
     * Check if session exists
     */
    async hasSession(sessionId: string): Promise<boolean> {
        try {
            const key = this.getRedisKey(sessionId);
            const exists = await this.redis.exists(key);
            return exists === 1;
        } catch (error) {
            this.logger.error(`Error checking session existence: ${error.message}`, 'ConnectionTrackingService');
            return false;
        }
    }

    /**
     * Check if agent connection exists
     */
    async hasAgentConnection(agentId: string, workspaceId: string): Promise<boolean> {
        try {
            const key = this.getAgentRedisKey(agentId, workspaceId);
            const exists = await this.redis.exists(key);
            return exists === 1;
        } catch (error) {
            this.logger.error(`Error checking agent connection existence: ${error.message}`, 'ConnectionTrackingService');
            return false;
        }
    }

    /**
     * Get session connections
     */
    async getSessionConnections(sessionId: string): Promise<ConnectionData | null> {
        try {
            const key = this.getRedisKey(sessionId);
            const data = await this.redis.get(key);

            if (!data) {
                return null;
            }

            const connectionData: ConnectionData = JSON.parse(data);

            // Convert string dates back to Date objects
            connectionData.lastUpdated = new Date(connectionData.lastUpdated);

            return connectionData;
        } catch (error) {
            this.logger.error(`Error getting session connections: ${error.message}`, 'ConnectionTrackingService');
            return null;
        }
    }

    /**
     * Get agent connections
     */
    async getAgentConnections(agentId: string, workspaceId: string): Promise<AgentConnectionData | null> {
        try {
            const key = this.getAgentRedisKey(agentId, workspaceId);
            const data = await this.redis.get(key);

            if (!data) {
                this.logger.log(`No Redis data found for agent ${agentId} in workspace ${workspaceId}. Key: ${key}`, 'ConnectionTrackingService');
                return null;
            }

            const connectionData: AgentConnectionData = JSON.parse(data);

            // Convert string dates back to Date objects
            connectionData.lastUpdated = new Date(connectionData.lastUpdated);

            this.logger.log(`Retrieved agent connection data for ${agentId} in workspace ${workspaceId}. Key: ${key}, Data:`, 'ConnectionTrackingService', {
                socketIds: connectionData.socketIds,
                joinedRooms: connectionData.joinedRooms,
                totalRoomsJoined: connectionData.totalRoomsJoined,
                status: connectionData.status
            });

            return connectionData;
        } catch (error) {
            this.logger.error(`Error getting agent connections: ${error.message}`, 'ConnectionTrackingService');
            return null;
        }
    }

    /**
     * Get agent joined rooms
     */
    async getAgentJoinedRooms(agentId: string, workspaceId: string): Promise<string[]> {
        try {
            const agentData = await this.getAgentConnections(agentId, workspaceId);
            if (!agentData) {
                this.logger.log(`No agent connection data found for agent ${agentId} in workspace ${workspaceId}`, 'ConnectionTrackingService');
                return [];
            }

            // Return the joined rooms directly
            const joinedRooms = agentData.joinedRooms || [];

            this.logger.log(`Retrieved ${joinedRooms.length} unique rooms for agent ${agentId} in workspace ${workspaceId}`, 'ConnectionTrackingService', {
                rooms: joinedRooms,
                totalRoomsJoined: agentData.totalRoomsJoined
            });

            return joinedRooms;
        } catch (error) {
            this.logger.error(`Error getting agent joined rooms: ${error.message}`, 'ConnectionTrackingService');
            return [];
        }
    }

    /**
     * Set session connections
     */
    async setSessionConnections(sessionId: string, connectionData: ConnectionData): Promise<void> {
        try {
            await this.updateConnectionData(sessionId, connectionData);
            this.logger.log(`Session connections updated: ${sessionId}`, 'ConnectionTrackingService');
        } catch (error) {
            this.logger.error(`Error setting session connections: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Set agent connections
     */
    async setAgentConnections(agentId: string, workspaceId: string, connectionData: AgentConnectionData): Promise<void> {
        try {
            await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
            this.logger.log(`Agent connections updated: ${agentId} in workspace ${workspaceId}`, 'ConnectionTrackingService');
        } catch (error) {
            this.logger.error(`Error setting agent connections: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Add connection to session
     */
    async addConnection(
        sessionId: string,
        socketId: string,
        userType: 'visitor' | 'agent',
        workspaceId?: string,
        userId?: string
    ): Promise<ConnectionData> {
        try {
            const existingData = await this.getSessionConnections(sessionId);

            if (existingData) {
                // Add new socket ID
                const updatedSocketIds = [...existingData.socketIds, socketId];

                // Update status to ACTIVE if it was AWAY or IDLE
                let newStatus = existingData.status;
                if (existingData.status === SessionStatus.AWAY || existingData.status === SessionStatus.IDLE) {
                    newStatus = SessionStatus.ACTIVE;
                }

                const connectionData: ConnectionData = {
                    sessionId,
                    userType,
                    socketIds: updatedSocketIds,
                    status: newStatus,
                    lastUpdated: new Date(),
                    workspaceId: workspaceId || existingData.workspaceId,
                    userId: userId || existingData.userId,
                };

                await this.updateConnectionData(sessionId, connectionData);
                this.logger.log(`Connection added: ${socketId} to session ${sessionId}`, 'ConnectionTrackingService');
                return connectionData;
            } else {
                // Create new session connection
                const connectionData: ConnectionData = {
                    sessionId,
                    userType,
                    socketIds: [socketId],
                    status: SessionStatus.ACTIVE,
                    lastUpdated: new Date(),
                    workspaceId,
                    userId,
                };

                await this.updateConnectionData(sessionId, connectionData);
                this.logger.log(`New session connection created: ${sessionId} with socket ${socketId}`, 'ConnectionTrackingService');
                return connectionData;
            }
        } catch (error) {
            this.logger.error(`Error adding connection: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Add agent connection
     */
    async addAgentConnection(
        agentId: string,
        workspaceId: string,
        socketId: string
    ): Promise<AgentConnectionData> {
        try {
            const existingData = await this.getAgentConnections(agentId, workspaceId);

            if (existingData) {
                // Add new socket ID
                const updatedSocketIds = [...existingData.socketIds, socketId];

                // Initialize socket rooms for new socket
                const updatedSocketRooms = {
                    ...existingData.socketRooms,
                    [socketId]: [] // Initialize empty room list for new socket
                };

                // Determine status based on total rooms joined
                let newStatus = existingData.status;
                if (existingData.totalRoomsJoined > 0) {
                    newStatus = AgentStatus.BUSY;
                } else {
                    newStatus = AgentStatus.ONLINE;
                }

                const connectionData: AgentConnectionData = {
                    sessionId: `${agentId}:${workspaceId}`,
                    userType: 'agent',
                    socketIds: updatedSocketIds,
                    status: newStatus,
                    lastUpdated: new Date(),
                    workspaceId,
                    userId: agentId,
                    joinedRooms: existingData.joinedRooms,
                    socketRooms: updatedSocketRooms,
                    totalRoomsJoined: existingData.totalRoomsJoined,
                };

                await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
                this.logger.log(`Agent connection added: ${socketId} to agent ${agentId}`, 'ConnectionTrackingService');
                return connectionData;
            } else {
                // Create new agent connection
                const connectionData: AgentConnectionData = {
                    sessionId: `${agentId}:${workspaceId}`,
                    userType: 'agent',
                    socketIds: [socketId],
                    status: AgentStatus.ONLINE,
                    lastUpdated: new Date(),
                    workspaceId,
                    userId: agentId,
                    joinedRooms: [],
                    socketRooms: {},
                    totalRoomsJoined: 0,
                };

                await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
                this.logger.log(`New agent connection created: ${agentId} with socket ${socketId}`, 'ConnectionTrackingService');
                return connectionData;
            }
        } catch (error) {
            this.logger.error(`Error adding agent connection: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Remove connection from session
     */
    async removeConnection(sessionId: string, socketId: string): Promise<ConnectionData | null> {
        try {
            const existingData = await this.getSessionConnections(sessionId);
            if (!existingData) {
                return null;
            }

            // Remove the socket ID
            const updatedSocketIds = existingData.socketIds.filter(id => id !== socketId);

            if (updatedSocketIds.length === 0) {
                // No more connections, mark as AWAY
                const connectionData: ConnectionData = {
                    ...existingData,
                    socketIds: [],
                    status: SessionStatus.AWAY,
                    lastUpdated: new Date(),
                };

                await this.updateConnectionData(sessionId, connectionData);
                this.logger.log(`Session ${sessionId} marked as AWAY - no more connections`, 'ConnectionTrackingService');
                return connectionData;
            } else {
                // Update with remaining connections
                const connectionData: ConnectionData = {
                    ...existingData,
                    socketIds: updatedSocketIds,
                    lastUpdated: new Date(),
                };

                await this.updateConnectionData(sessionId, connectionData);
                this.logger.log(`Connection removed: ${socketId} from session ${sessionId}, ${updatedSocketIds.length} remaining`, 'ConnectionTrackingService');
                return connectionData;
            }
        } catch (error) {
            this.logger.error(`Error removing connection: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Remove agent connection
     */
    async removeAgentConnection(agentId: string, workspaceId: string, socketId: string): Promise<AgentConnectionData | null> {
        try {
            const existingData = await this.getAgentConnections(agentId, workspaceId);
            if (!existingData) {
                return null;
            }

            // Remove the socket ID and its rooms
            const updatedSocketIds = existingData.socketIds.filter(id => id !== socketId);
            const updatedSocketRooms = { ...existingData.socketRooms };
            delete updatedSocketRooms[socketId];

            // Recalculate total rooms joined (keep all rooms since we're tracking per agent, not per socket)
            const totalRoomsJoined = Object.values(updatedSocketRooms).reduce((sum, rooms) => sum + rooms.length, 0);

            if (updatedSocketIds.length === 0) {
                // No more connections, mark as OFFLINE
                const connectionData: AgentConnectionData = {
                    ...existingData,
                    socketIds: [],
                    status: AgentStatus.OFFLINE,
                    lastUpdated: new Date(),
                    socketRooms: updatedSocketRooms,
                    totalRoomsJoined,
                };

                await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
                this.logger.log(`Agent ${agentId} marked as OFFLINE - no more connections`, 'ConnectionTrackingService');
                return connectionData;
            } else {
                // Update with remaining connections
                let newStatus = existingData.status;
                if (totalRoomsJoined > 0) {
                    newStatus = AgentStatus.BUSY;
                } else {
                    newStatus = AgentStatus.ONLINE;
                }

                const connectionData: AgentConnectionData = {
                    ...existingData,
                    socketIds: updatedSocketIds,
                    status: newStatus,
                    lastUpdated: new Date(),
                    totalRoomsJoined,
                    socketRooms: updatedSocketRooms,
                };

                await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
                this.logger.log(`Agent connection removed: ${socketId} from agent ${agentId}, ${updatedSocketIds.length} remaining`, 'ConnectionTrackingService');
                return connectionData;
            }
        } catch (error) {
            this.logger.error(`Error removing agent connection: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Check if agent is already in a room
     */
    async isAgentAlreadyInRoom(agentId: string, workspaceId: string, roomId: string): Promise<boolean> {
        try {
            const agentData = await this.getAgentConnections(agentId, workspaceId);
            if (!agentData) {
                this.logger.log(`No agent connection data found for agent ${agentId} in workspace ${workspaceId}`, 'ConnectionTrackingService');
                return false;
            }

            this.logger.log(`Checking if agent ${agentId} is already in room ${roomId}. All joined rooms:`, 'ConnectionTrackingService', { joinedRooms: agentData.joinedRooms });

            // Check if the agent is already in this room
            const isAlreadyInRoom = agentData.joinedRooms.includes(roomId);

            this.logger.log(`Agent ${agentId} ${isAlreadyInRoom ? 'is' : 'is not'} already in room ${roomId}`, 'ConnectionTrackingService');
            return isAlreadyInRoom;
        } catch (error) {
            this.logger.error(`Error checking if agent is already in room: ${error.message}`, 'ConnectionTrackingService');
            return false;
        }
    }

    /**
     * Check if agent is already in a room from a different socket
     */
    async isAgentAlreadyInRoomFromDifferentSocket(agentId: string, workspaceId: string, currentSocketId: string, roomId: string): Promise<boolean> {
        try {
            const agentData = await this.getAgentConnections(agentId, workspaceId);
            if (!agentData) {
                this.logger.log(`No agent connection data found for agent ${agentId} in workspace ${workspaceId}`, 'ConnectionTrackingService');
                return false;
            }

            // Check if any other socket (not the current one) is in this room
            for (const [socketId, rooms] of Object.entries(agentData.socketRooms)) {
                // Only check sockets that are different from the current socket
                if (socketId !== currentSocketId && rooms.includes(roomId)) {
                    return true;
                }
            }

            this.logger.log(`Agent ${agentId} is not already in room ${roomId} from different socket`, 'ConnectionTrackingService');
            return false;
        } catch (error) {
            this.logger.error(`Error checking if agent is already in room from different socket: ${error.message}`, 'ConnectionTrackingService');
            return false;
        }
    }

    /**
     * Add room to agent socket
     */
    async addRoomToAgentSocket(agentId: string, workspaceId: string, socketId: string, roomId: string): Promise<AgentConnectionData | null> {
        try {
            const existingData = await this.getAgentConnections(agentId, workspaceId);
            if (!existingData) {
                return null;
            }

            // Add room to agent's joined rooms (if not already there)
            const updatedJoinedRooms = existingData.joinedRooms.includes(roomId)
                ? existingData.joinedRooms
                : [...existingData.joinedRooms, roomId];

            // Add room to the specific socket's rooms
            const updatedSocketRooms = { ...existingData.socketRooms };
            if (!updatedSocketRooms[socketId]) {
                updatedSocketRooms[socketId] = [];
            }
            updatedSocketRooms[socketId] = [...updatedSocketRooms[socketId], roomId];

            // Update status to BUSY if rooms are joined
            const newStatus = updatedJoinedRooms.length > 0 || Object.values(updatedSocketRooms).some(rooms => rooms.length > 0) ? AgentStatus.BUSY : AgentStatus.ONLINE;

            const connectionData: AgentConnectionData = {
                ...existingData,
                status: newStatus,
                lastUpdated: new Date(),
                joinedRooms: updatedJoinedRooms,
                socketRooms: updatedSocketRooms,
                totalRoomsJoined: updatedJoinedRooms.length,
            };

            await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
            this.logger.log(`Room ${roomId} added to agent ${agentId} socket ${socketId}. Updated joined rooms:`, 'ConnectionTrackingService', { joinedRooms: connectionData.joinedRooms });
            return connectionData;
        } catch (error) {
            this.logger.error(`Error adding room to agent socket: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Remove room from agent socket
     */
    async removeRoomFromAgentSocket(agentId: string, workspaceId: string, socketId: string, roomId: string): Promise<AgentConnectionData | null> {
        try {
            const existingData = await this.getAgentConnections(agentId, workspaceId);
            if (!existingData) {
                return null;
            }

            // Remove room from the specific socket's rooms
            const updatedSocketRooms = { ...existingData.socketRooms };
            if (updatedSocketRooms[socketId]) {
                updatedSocketRooms[socketId] = updatedSocketRooms[socketId].filter(r => r !== roomId);
            }

            const isRoomInOtherSockets = await this.isAgentAlreadyInRoomFromDifferentSocket(agentId, workspaceId, socketId, roomId);

            let updatedJoinedRooms = existingData.joinedRooms;
            if (!isRoomInOtherSockets) {
                // Remove room from agent's joined rooms
                updatedJoinedRooms = existingData.joinedRooms.filter(room => room !== roomId);
            }

            // Update status based on total rooms
            let newStatus = existingData.status;
            if (updatedJoinedRooms.length > 0 || Object.values(updatedSocketRooms).some(rooms => rooms.length > 0)) {
                newStatus = AgentStatus.BUSY;
            } else {
                newStatus = AgentStatus.ONLINE;
            }

            const connectionData: AgentConnectionData = {
                ...existingData,
                status: newStatus,
                lastUpdated: new Date(),
                joinedRooms: updatedJoinedRooms,
                socketRooms: updatedSocketRooms,
                totalRoomsJoined: updatedJoinedRooms.length,
            };

            await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
            this.logger.log(`Room ${roomId} removed from agent ${agentId} socket ${socketId}`, 'ConnectionTrackingService');
            return connectionData;
        } catch (error) {
            this.logger.error(`Error removing room from agent socket: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Update session status
     */
    async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<ConnectionData | null> {
        try {
            const existingData = await this.getSessionConnections(sessionId);
            if (!existingData) {
                return null;
            }

            const connectionData: ConnectionData = {
                ...existingData,
                status,
                lastUpdated: new Date(),
            };

            await this.updateConnectionData(sessionId, connectionData);
            this.logger.log(`Session ${sessionId} status updated to ${status}`, 'ConnectionTrackingService');
            return connectionData;
        } catch (error) {
            this.logger.error(`Error updating session status: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    /**
     * Remove agent connection data
     */
    async removeAgentConnectionData(agentId: string, workspaceId: string): Promise<void> {
        const key = this.getAgentRedisKey(agentId, workspaceId);
        await this.redis.del(key);
    }

    /**
     * Remove session connection data
     */
    async removeSessionConnectionData(sessionId: string): Promise<void> {
        const key = this.getRedisKey(sessionId);
        await this.redis.del(key);
    }

    /**
     * Update agent status
     */
    async updateAgentStatus(agentId: string, workspaceId: string, status: AgentStatus): Promise<AgentConnectionData | null> {
        try {
            const existingData = await this.getAgentConnections(agentId, workspaceId);
            if (!existingData) {
                return null;
            }

            const connectionData: AgentConnectionData = {
                ...existingData,
                status,
                lastUpdated: new Date(),
            };

            await this.updateAgentConnectionData(agentId, workspaceId, connectionData);
            this.logger.log(`Agent ${agentId} status updated to ${status}`, 'ConnectionTrackingService');
            return connectionData;
        } catch (error) {
            this.logger.error(`Error updating agent status: ${error.message}`, 'ConnectionTrackingService');
            throw error;
        }
    }

    private async updateConnectionData(sessionId: string, connectionData: ConnectionData): Promise<void> {
        const key = this.getRedisKey(sessionId);
        connectionData.lastUpdated = new Date();

        await this.redis.set(
            key,
            JSON.stringify(connectionData)
        );
    }

    private async updateAgentConnectionData(agentId: string, workspaceId: string, connectionData: AgentConnectionData): Promise<void> {
        const key = this.getAgentRedisKey(agentId, workspaceId);
        connectionData.lastUpdated = new Date();

        this.logger.log(`Updating agent connection data for ${agentId} in workspace ${workspaceId}. Key: ${key}, Data:`, 'ConnectionTrackingService', {
            socketIds: connectionData.socketIds,
            joinedRooms: connectionData.joinedRooms,
            socketRooms: connectionData.socketRooms,
            totalRoomsJoined: connectionData.totalRoomsJoined,
            status: connectionData.status
        });

        await this.redis.set(
            key,
            JSON.stringify(connectionData)
        );
    }
}