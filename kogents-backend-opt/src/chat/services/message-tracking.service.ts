import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../../common/logger/app-logger.service';

export interface TrackedMessage {
    messageId: string;
    roomId: string;
    content: string;
    senderId: string;
    senderType: string;
    createdAt: Date;
    workspaceId: string;
    recipients: string[];
    senderName?: string;
    deliveredAt?: Date;
    deliveredTo?: string[];
}

export interface MessageTrackingData {
    messages: TrackedMessage[];
    lastUpdated: Date;
}

@Injectable()
export class MessageTrackingService {
    private readonly REDIS_KEY_PREFIX = 'message_tracking';

    constructor(
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        private readonly logger: AppLoggerService,
    ) { }

    private getRedisKey(roomId: string): string {
        return `${this.REDIS_KEY_PREFIX}:${roomId}`;
    }

    /**
     * Add a message to tracking
     */
    async addMessage(roomId: string, message: TrackedMessage): Promise<void> {
        try {
            const key = this.getRedisKey(roomId);

            // Get existing messages
            const existingData = await this.getMessages(roomId);
            const messages = existingData?.messages || [];

            // Add new message
            messages.push(message);

            // Update tracking data
            const trackingData: MessageTrackingData = {
                messages,
                lastUpdated: new Date(),
            };

            // Update tracking data
            await this.updateTrackingData(roomId, trackingData);

            this.logger.log(`Message ${message.messageId} added to tracking for room ${roomId}`, 'MessageTrackingService');
        } catch (error) {
            this.logger.error(`Error adding message to tracking: ${error.message}`, 'MessageTrackingService');
            throw error;
        }
    }

    /**
     * Get all tracked messages for a room
     */
    async getMessages(roomId: string): Promise<MessageTrackingData | null> {
        try {
            const key = this.getRedisKey(roomId);
            const data = await this.redis.get(key);

            if (!data) {
                return null;
            }

            const trackingData: MessageTrackingData = JSON.parse(data);

            // Convert string dates back to Date objects
            trackingData.lastUpdated = new Date(trackingData.lastUpdated);
            trackingData.messages.forEach(msg => {
                msg.createdAt = new Date(msg.createdAt);
                if (msg.deliveredAt) msg.deliveredAt = new Date(msg.deliveredAt);
            });

            return trackingData;
        } catch (error) {
            this.logger.error(`Error getting messages from tracking: ${error.message}`, 'MessageTrackingService');
            return null;
        }
    }

    /**
     * Mark message as delivered to a specific recipient
     * Only updates the deliveredAt timestamp, keeps tracking for read status
     */
    async markMessagesAsDelivered(roomId: string, messageIds: string[], recipientId: string): Promise<void> {
        try {
            const trackingData = await this.getMessages(roomId);
            if (!trackingData) return;

            const ids = new Set(messageIds);

            trackingData.messages = trackingData.messages.map(m => {
                if (!ids.has(m.messageId)) return m;

                // Only mark if this message is intended for this recipient
                if (!m.recipients?.includes(recipientId)) return m;

                const deliveredSet = new Set(m.deliveredTo || []);
                deliveredSet.add(recipientId);

                const allDelivered = (m.recipients || []).every(r => deliveredSet.has(r));

                return {
                    ...m,
                    deliveredTo: Array.from(deliveredSet),
                    deliveredAt: allDelivered ? (m.deliveredAt ?? new Date()) : m.deliveredAt,
                };
            });

            await this.updateTrackingData(roomId, trackingData);
            this.logger.log(`Marked delivered to ${recipientId} (${messageIds.length} messages) in room ${roomId}`, 'MessageTrackingService');
        } catch (error) {
            this.logger.error(`Error marking message as delivered: ${error.message}`, 'MessageTrackingService');
            throw error;
        }
    }

    /**
     * Mark message as read by a specific recipient
     * If all recipients have read the message, remove it from tracking
     */
    async markMessageAsRead(roomId: string, messageId: string, recipientId: string): Promise<void> {
        try {
            const trackingData = await this.getMessages(roomId);
            if (!trackingData) {
                return;
            }

            const message = trackingData.messages.find(m => m.messageId === messageId);
            if (message) {
                // Remove this recipient from the recipients list
                message.recipients = message.recipients.filter(r => r !== recipientId);

                // If no recipients remain, remove the message entirely
                if (message.recipients.length === 0) {
                    trackingData.messages = trackingData.messages.filter(m => m.messageId !== messageId);

                    // If no messages remain in the room, remove the entire tracking entry
                    if (trackingData.messages.length === 0) {
                        await this.removeTracking(roomId);
                        this.logger.log(`Message ${messageId} read by all recipients, removed from tracking in room ${roomId}`, 'MessageTrackingService');
                    } else {
                        // Update tracking data with remaining messages
                        await this.updateTrackingData(roomId, trackingData);
                        this.logger.log(`Message ${messageId} read by ${recipientId}, ${message.recipients.length} recipients remaining in room ${roomId}`, 'MessageTrackingService');
                    }
                } else {
                    // Update tracking data with updated message
                    trackingData.messages = trackingData.messages.map(m => {
                        if (m.messageId === messageId) {
                            return message;
                        }
                        return m;
                    });
                    // Update tracking data with remaining recipients
                    await this.updateTrackingData(roomId, trackingData);
                    this.logger.log(`Message ${messageId} read by ${recipientId}, ${message.recipients.length} recipients remaining in room ${roomId}`, 'MessageTrackingService');
                }
            }
        } catch (error) {
            this.logger.error(`Error marking message as read: ${error.message}`, 'MessageTrackingService');
            throw error;
        }
    }

    /**
     * Remove tracking for a room
     */
    async removeTracking(roomId: string): Promise<void> {
        try {
            const key = this.getRedisKey(roomId);
            await this.redis.del(key);
            this.logger.log(`Removed message tracking for room ${roomId}`, 'MessageTrackingService');
        } catch (error) {
            this.logger.error(`Error removing message tracking: ${error.message}`, 'MessageTrackingService');
            throw error;
        }
    }

    /**
     * Update tracking data for a room
     */
    private async updateTrackingData(roomId: string, trackingData: MessageTrackingData): Promise<void> {
        const key = this.getRedisKey(roomId);
        trackingData.lastUpdated = new Date();

        await this.redis.set(
            key,
            JSON.stringify(trackingData)
        );
    }
} 