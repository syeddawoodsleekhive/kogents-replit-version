import { Injectable, Inject } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { EmailJobType } from '../../email/workers/email.processor';

@Injectable()
export class ChatNotificationsProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        private readonly redis: Redis,
        @Inject('EMAIL_SERVICE') private readonly emailService: any,
    ) { }

    // Circuit breaker for external services
    private emailFailureCount = 0;
    private readonly MAX_EMAIL_FAILURES = 3;
    private readonly EMAIL_CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
    private emailCircuitBreakerOpen = false;
    private emailCircuitBreakerOpenTime = 0;

    // Rate limiting for email notifications
    private readonly EMAIL_RATE_LIMIT = 10; // emails per minute per workspace
    private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

    createWorker(): Worker {
        return new Worker('chat-notifications', async (job) => {
            this.logger.log(`Processing chat notification job: ${job.id}`, 'ChatNotificationsProcessor');

            try {
                // Handle both old and new job structures
                let { type, data } = job.data;

                // If this is the new structure, extract type and data
                if (!type && job.data.type) {
                    type = job.data.type;
                    data = job.data.data;
                }

                switch (type) {
                    case 'new_chat_request':
                        await this.processNewChatNotification(data);
                        break;
                    case 'agent_assigned':
                        await this.processAgentAssignmentNotification(data);
                        break;
                    case 'chat_transfer':
                        await this.processChatTransferNotification(data);
                        break;
                    case 'chat_ended':
                        await this.processChatEndNotification(data);
                        break;
                    default:
                        this.logger.warn(`Unknown notification type: ${type}`, 'ChatNotificationsProcessor');
                }

                this.logger.log(`Chat notification processed: ${type}`, 'ChatNotificationsProcessor');
            } catch (error) {
                this.logger.error(`Chat notification processing error: ${error.message}`, 'ChatNotificationsProcessor');
                throw error;
            }
        }, {
            connection: this.redis,
            concurrency: 5,
        });
    }

    private async processNewChatNotification(data: any) {
        const { roomId, visitorId, workspaceId, priority } = data;

        try {
            // Check rate limit first
            if (!(await this.checkEmailRateLimit(workspaceId))) {
                this.logger.warn(`Email rate limit exceeded for workspace ${workspaceId}`, 'ChatNotificationsProcessor');
                return;
            }

            // Get workspace info from cache first
            const workspace = await this.getWorkspaceFromCache(workspaceId);
            if (!workspace) {
                this.logger.error(`Workspace not found for notification: ${workspaceId}`, 'ChatNotificationsProcessor');
                return;
            }

            // Get available agents from Redis cache (much faster than DB)
            const availableAgentIds = await this.getAvailableAgentsFromCache(workspaceId);

            if (availableAgentIds.length === 0) {
                this.logger.warn(`No available agents found for workspace ${workspaceId}`, 'ChatNotificationsProcessor');
                return;
            }

            // Get agent details in parallel (batch operation)
            const agents = await this.getAgentDetailsBatch(availableAgentIds);

            // Send notifications in parallel for better performance
            const notificationPromises = agents.map(agent =>
                this.sendNewChatEmailNotification(agent, {
                    roomId,
                    visitorId,
                    priority,
                    workspaceName: workspace.name,
                })
            );

            // Wait for all notifications to complete
            const results = await Promise.allSettled(notificationPromises);

            // Log results
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            this.logger.log(`New chat notifications: ${successful} sent, ${failed} failed for room ${roomId}`, 'ChatNotificationsProcessor');

            // Send webhook notification if configured
            await this.sendWorkspaceWebhook(workspace, {
                type: 'new_chat_request',
                roomId,
                visitorId,
                priority,
                workspaceId,
                timestamp: new Date(),
            });

        } catch (error) {
            this.logger.error(`Process new chat notification error: ${error.message}`, 'ChatNotificationsProcessor');
            throw error;
        }
    }

    private async processAgentAssignmentNotification(data: any) {
        const { roomId, agentId } = data;

        try {
            // Get agent info from cache first
            const agent = await this.getAgentFromCache(agentId);
            if (!agent) {
                this.logger.error(`Agent not found for assignment notification: ${agentId}`, 'ChatNotificationsProcessor');
                return;
            }

            // Send assignment confirmation email
            await this.sendAgentAssignmentEmail(agent, roomId);

            this.logger.log(`Assignment notification sent to agent: ${agent.email}`, 'ChatNotificationsProcessor');
        } catch (error) {
            this.logger.error(`Process agent assignment notification error: ${error.message}`, 'ChatNotificationsProcessor');
            throw error;
        }
    }

    private async processChatTransferNotification(data: any) {
        const { roomId, fromAgentId, toAgentId, reason } = data;

        try {
            // Get agent info from cache in parallel
            const [fromAgent, toAgent] = await Promise.all([
                this.getAgentFromCache(fromAgentId),
                this.getAgentFromCache(toAgentId),
            ]);

            if (!fromAgent || !toAgent) {
                this.logger.error(`Agent not found for transfer notification`, 'ChatNotificationsProcessor');
                return;
            }

            // Send transfer notifications in parallel
            await Promise.allSettled([
                this.sendChatTransferEmail(toAgent, roomId, fromAgent.name, reason, 'received'),
                this.sendChatTransferEmail(fromAgent, roomId, toAgent.name, reason, 'sent'),
            ]);

            this.logger.log(`Transfer notifications sent for room: ${roomId}`, 'ChatNotificationsProcessor');
        } catch (error) {
            this.logger.error(`Process chat transfer notification error: ${error.message}`, 'ChatNotificationsProcessor');
            throw error;
        }
    }

    private async processChatEndNotification(data: any) {
        const { roomId, visitorId, agentId, rating, feedback } = data;

        try {
            // Get chat analytics from cache if available
            const analytics = await this.getChatAnalyticsFromCache(roomId);

            if (agentId) {
                const agent = await this.getAgentFromCache(agentId);
                if (agent) {
                    await this.sendChatSummaryEmail(agent, {
                        roomId,
                        visitorId,
                        rating,
                        feedback,
                        duration: analytics?.chatDuration || 0,
                        messageCount: analytics?.messageCount || 0,
                    });

                    this.logger.log(`Chat summary sent to agent: ${agent.email}`, 'ChatNotificationsProcessor');
                }
            }
        } catch (error) {
            this.logger.error(`Process chat end notification error: ${error.message}`, 'ChatNotificationsProcessor');
            throw error;
        }
    }

    // Cache-first helper methods
    private async getWorkspaceFromCache(workspaceId: string): Promise<any> {
        try {
            // Try cache first
            const cacheKey = `workspace:${workspaceId}:details`;
            const cached = await this.redis.get(cacheKey);

            if (cached) {
                return JSON.parse(cached);
            }

            // Fallback to database
            const workspace = await this.prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: {
                    id: true,
                    name: true,
                    branding: true,
                },
            });

            if (workspace) {
                // Cache for 30 minutes
                await this.redis.setex(cacheKey, 1800, JSON.stringify(workspace));
            }

            return workspace;
        } catch (error) {
            this.logger.error(`Get workspace from cache error: ${error.message}`, 'ChatNotificationsProcessor');
            return null;
        }
    }

    private async getAvailableAgentsFromCache(workspaceId: string): Promise<string[]> {
        try {
            // Use the same cache key as AgentService
            const availableAgents = await this.redis.smembers(`workspace:${workspaceId}:available_agents`);
            return availableAgents || [];
        } catch (error) {
            this.logger.error(`Get available agents from cache error: ${error.message}`, 'ChatNotificationsProcessor');
            return [];
        }
    }

    private async getAgentFromCache(agentId: string): Promise<any> {
        try {
            // Try cache first
            const cacheKey = `agent:${agentId}:details`;
            const cached = await this.redis.get(cacheKey);

            if (cached) {
                return JSON.parse(cached);
            }

            // Fallback to database
            const agent = await this.prisma.user.findUnique({
                where: { id: agentId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            });

            if (agent) {
                // Cache for 15 minutes
                await this.redis.setex(cacheKey, 900, JSON.stringify(agent));
            }

            return agent;
        } catch (error) {
            this.logger.error(`Get agent from cache error: ${error.message}`, 'ChatNotificationsProcessor');
            return null;
        }
    }

    private async getAgentDetailsBatch(agentIds: string[]): Promise<any[]> {
        try {
            // Try to get all from cache first
            const promises = agentIds.map(id => this.getAgentFromCache(id));
            const agents = await Promise.all(promises);

            // Filter out null results
            return agents.filter(agent => agent !== null);
        } catch (error) {
            this.logger.error(`Get agent details batch error: ${error.message}`, 'ChatNotificationsProcessor');
            return [];
        }
    }

    private async getChatAnalyticsFromCache(roomId: string): Promise<any> {
        try {
            const cacheKey = `chat:analytics:${roomId}:summary`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.error(`Get chat analytics from cache error: ${error.message}`, 'ChatNotificationsProcessor');
            return null;
        }
    }

    // Email sending methods with circuit breaker
    private async sendNewChatEmailNotification(agent: any, data: any): Promise<void> {
        if (this.emailCircuitBreakerOpen) {
            const timeSinceOpen = Date.now() - this.emailCircuitBreakerOpenTime;
            if (timeSinceOpen < this.EMAIL_CIRCUIT_BREAKER_TIMEOUT) {
                throw new Error('Email service circuit breaker is open');
            } else {
                // Reset circuit breaker
                this.emailCircuitBreakerOpen = false;
                this.emailFailureCount = 0;
                this.logger.log('Email circuit breaker reset', 'ChatNotificationsProcessor');
            }
        }

        try {
            await this.emailService.sendEmail({
                to: agent.email,
                agentName: agent.name,
                roomId: data.roomId,
                visitorId: data.visitorId,
                priority: data.priority,
                workspaceName: data.workspaceName,
            }, EmailJobType.SEND_NEW_CHAT_REQUEST);

            this.emailFailureCount = 0; // Reset on success
        } catch (error) {
            this.emailFailureCount++;
            if (this.emailFailureCount >= this.MAX_EMAIL_FAILURES) {
                this.emailCircuitBreakerOpen = true;
                this.emailCircuitBreakerOpenTime = Date.now();
                this.logger.error(`Email circuit breaker opened after ${this.emailFailureCount} failures`, 'ChatNotificationsProcessor');
            }
            throw error;
        }
    }

    private async sendAgentAssignmentEmail(agent: any, roomId: string): Promise<void> {
        try {
            await this.emailService.sendEmail({
                to: agent.email,
                agentName: agent.name,
                roomId,
            }, EmailJobType.SEND_CHAT_ASSIGNMENT);
        } catch (error) {
            this.logger.error(`Failed to send assignment notification: ${error.message}`, 'ChatNotificationsProcessor');
            throw error;
        }
    }

    private async sendChatTransferEmail(agent: any, roomId: string, otherAgentName: string, reason: string, type: 'received' | 'sent'): Promise<void> {
        try {
            const isReceiving = type === 'received';
            await this.emailService.sendEmail({
                to: agent.email,
                agentName: agent.name,
                roomId,
                [isReceiving ? 'fromAgentName' : 'toAgentName']: otherAgentName,
                reason,
            }, EmailJobType.SEND_CHAT_TRANSFER);
        } catch (error) {
            this.logger.error(`Failed to send transfer notification: ${error.message}`, 'ChatNotificationsProcessor');
            throw error;
        }
    }

    private async sendChatSummaryEmail(agent: any, data: any): Promise<void> {
        try {
            await this.emailService.sendEmail({
                to: agent.email,
                agentName: agent.name,
                roomId: data.roomId,
                visitorId: data.visitorId,
                duration: data.duration,
                messageCount: data.messageCount,
                rating: data.rating,
            }, EmailJobType.SEND_CHAT_SUMMARY);
        } catch (error) {
            this.logger.error(`Failed to send chat summary: ${error.message}`, 'ChatNotificationsProcessor');
            throw error;
        }
    }

    // Rate limiting
    private async checkEmailRateLimit(workspaceId: string): Promise<boolean> {
        try {
            const rateLimitKey = `rate_limit:email:${workspaceId}`;
            const current = await this.redis.get(rateLimitKey);

            if (current && parseInt(current) >= this.EMAIL_RATE_LIMIT) {
                return false;
            }

            // Increment counter
            await this.redis.multi()
                .incr(rateLimitKey)
                .expire(rateLimitKey, Math.ceil(this.RATE_LIMIT_WINDOW / 1000))
                .exec();

            return true;
        } catch (error) {
            this.logger.error(`Check email rate limit error: ${error.message}`, 'ChatNotificationsProcessor');
            return true; // Allow on error to avoid blocking
        }
    }

    private async sendWorkspaceWebhook(workspace: any, data: any): Promise<void> {
        if (workspace.branding && workspace.branding['webhook_url']) {
            try {
                await this.sendWebhookNotification(workspace.branding['webhook_url'], data);
            } catch (error) {
                this.logger.error(`Failed to send webhook notification: ${error.message}`, 'ChatNotificationsProcessor');
                // Don't throw - webhook failures shouldn't fail the entire job
            }
        }
    }

    private async sendWebhookNotification(webhookUrl: string, data: any): Promise<void> {
        // Implementation for webhook notifications
        // This would typically use axios or fetch to send HTTP requests
        this.logger.log(`Webhook notification sent to: ${webhookUrl}`, 'ChatNotificationsProcessor');
    }
} 