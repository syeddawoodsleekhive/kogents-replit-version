import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import {
    CreateInteractionDto,
    UpdateInteractionDto,
    InteractionResponseDto,
    InteractionAnalyticsDto
} from '../dtos/user-interactions';

@Injectable()
export class UserInteractionsService {
    private readonly CACHE_TTL = 7200; // 2 hours - consistent with other services
    private readonly INTERACTION_CACHE_PREFIX = 'analytics:interaction:';
    private readonly SESSION_CACHE_PREFIX = 'analytics:session_interactions:';
    private readonly TYPE_CACHE_PREFIX = 'analytics:interaction_type:';

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
    ) { }

    /**
     * Create user interaction - Cache-first, queue-driven
     */
    async createInteraction(dto: CreateInteractionDto): Promise<InteractionResponseDto> {
        this.logger.log(`Creating user interaction: ${dto.interactionType} for session: ${dto.sessionToken}`, 'UserInteractionsService');

        try {
            // Generate interaction ID for cache storage
            const interactionId = this.generateSecureId();
            const timestamp = new Date().toISOString();

            // Create interaction object for cache
            const interaction = {
                id: interactionId,
                sessionToken: dto.sessionToken,
                interactionType: dto.interactionType,
                behaviorType: dto.behaviorType || dto.interactionType,
                fieldName: dto.fieldName,
                elementId: dto.elementId,
                elementClass: dto.elementClass,
                elementText: dto.elementText,
                coordinates: dto.coordinates,
                scrollPosition: dto.scrollPosition,
                viewportSize: dto.viewportSize,
                timestampMs: dto.timestampMs,
                fieldFocusTime: dto.fieldFocusTime,
                typingSpeed: dto.typingSpeed,
                duration: dto.duration,
                fieldCompleted: dto.fieldCompleted,
                validationPassed: dto.validationPassed,
                errorMessage: dto.errorMessage,
                attemptsCount: dto.attemptsCount,
                inputLength: dto.inputLength,
                backspaceCount: dto.backspaceCount,
                pasteDetected: dto.pasteDetected,
                autocompleteUsed: dto.autocompleteUsed,
                pageUrl: dto.pageUrl,
                referrerUrl: dto.referrerUrl,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            // Write to cache immediately
            await this.cacheInteraction(interaction);

            // Cache by session token for quick lookup
            await this.cacheSessionInteraction(dto.sessionToken, interactionId);

            // Cache by interaction type for analytics
            await this.cacheTypeInteraction(dto.interactionType, interactionId);

            // Queue database write for background processing
            await this.analyticsQueue.add('interaction_created', {
                interaction,
                timestamp,
                priority: 'high',
            }, {
                delay: 1000, // 1 second delay for eventual consistency
            });

            // Queue analytics processing
            await this.analyticsQueue.add('interaction_analytics', {
                interactionId,
                sessionToken: dto.sessionToken,
                interactionType: dto.interactionType,
                timestamp,
            }, {
                delay: 5000, // 5 second delay for analytics
            });

            this.logger.log(`User interaction cached and queued: ${interactionId}`, 'UserInteractionsService');

            return this.mapToResponseDto(interaction);
        } catch (error) {
            this.logger.error(`Failed to create user interaction: ${error.message}`, 'UserInteractionsService', error);
            throw new BadRequestException('Failed to create user interaction');
        }
    }

    /**
     * Update user interaction - Cache-first, queue-driven
     */
    async updateInteraction(interactionId: string, dto: UpdateInteractionDto): Promise<InteractionResponseDto> {
        this.logger.log(`Updating user interaction: ${interactionId}`, 'UserInteractionsService');

        // Get from cache first
        let interaction = await this.getInteractionFromCache(interactionId);

        if (!interaction) {
            // Fallback to database if not in cache
            interaction = await this.prisma.formInteraction.findUnique({ where: { id: interactionId } });
            if (!interaction) {
                interaction = await this.prisma.userBehavior.findUnique({ where: { id: interactionId } });
            }

            if (!interaction) {
                throw new NotFoundException('User interaction not found');
            }

            // Cache the found interaction
            await this.cacheInteraction(interaction);
        }

        // Update interaction object
        const updatedInteraction = {
            ...interaction,
            // Add any fields that can be updated from UpdateInteractionDto
            updatedAt: new Date().toISOString(),
        };

        // Update cache immediately
        await this.cacheInteraction(updatedInteraction);

        // Queue database update for background processing
        await this.analyticsQueue.add('interaction_updated', {
            interactionId,
            updateData: {
                // Add any fields that can be updated
            },
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000, // 1 second delay
        });

        // Queue analytics update
        await this.analyticsQueue.add('interaction_analytics_update', {
            interactionId,
            timestamp: new Date().toISOString(),
        }, {
            delay: 5000, // 5 second delay
        });

        this.logger.log(`User interaction updated in cache and queued: ${interactionId}`, 'UserInteractionsService');

        return this.mapToResponseDto(updatedInteraction);
    }

    /**
     * Get user interaction by ID - Cache-first
     */
    async getInteraction(interactionId: string): Promise<InteractionResponseDto> {
        // Try cache first
        let interaction = await this.getInteractionFromCache(interactionId);

        if (!interaction) {
            // Fallback to database
            interaction = await this.prisma.formInteraction.findUnique({ where: { id: interactionId } });
            if (!interaction) {
                interaction = await this.prisma.userBehavior.findUnique({ where: { id: interactionId } });
            }

            if (!interaction) {
                throw new NotFoundException('User interaction not found');
            }

            // Cache for future requests
            await this.cacheInteraction(interaction);
        }

        return this.mapToResponseDto(interaction);
    }

    /**
     * Get user interactions by session token - Cache-first
     */
    async getUserInteractions(sessionToken: string, limit: number = 50): Promise<InteractionResponseDto[]> {
        // Try to get interaction IDs from session cache
        const cachedIds = await this.getSessionInteractionIds(sessionToken);

        if (cachedIds && cachedIds.length > 0) {
            // Get interactions from cache
            const interactions: any[] = [];
            for (const id of cachedIds.slice(0, limit)) {
                const interaction = await this.getInteractionFromCache(id);
                if (interaction) {
                    interactions.push(interaction);
                }
            }

            if (interactions.length > 0) {
                return interactions.map(interaction => this.mapToResponseDto(interaction));
            }
        }

        // Fallback to database
        const formInteractions = await this.prisma.formInteraction.findMany({
            where: { sessionToken },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        const userBehaviors = await this.prisma.userBehavior.findMany({
            where: { sessionToken },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // Cache all interactions and session mapping
        for (const interaction of [...formInteractions, ...userBehaviors]) {
            await this.cacheInteraction(interaction);
        }
        await this.cacheSessionInteractionIds(sessionToken, [...formInteractions, ...userBehaviors].map(i => i.id));

        return [
            ...formInteractions.map(i => this.mapToResponseDto(i)),
            ...userBehaviors.map(i => this.mapToResponseDto(i)),
        ];
    }

    /**
     * Get user interactions by type - Cache-first
     */
    async getInteractionsByType(interactionType: string, limit: number = 50): Promise<InteractionResponseDto[]> {
        // Try cache first
        const cacheKey = `${this.TYPE_CACHE_PREFIX}${interactionType}`;
        const cachedIds = await this.getTypeInteractionIds(cacheKey);

        if (cachedIds && cachedIds.length > 0) {
            const interactions: any[] = [];
            for (const id of cachedIds.slice(0, limit)) {
                const interaction = await this.getInteractionFromCache(id);
                if (interaction) {
                    interactions.push(interaction);
                }
            }

            if (interactions.length > 0) {
                return interactions.map(interaction => this.mapToResponseDto(interaction));
            }
        }

        // Fallback to database
        let interactions: any[] = [];
        if (interactionType === 'form_field') {
            interactions = await this.prisma.formInteraction.findMany({
                where: { interactionType },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        } else {
            interactions = await this.prisma.userBehavior.findMany({
                where: { behaviorType: interactionType },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        }

        // Cache results
        for (const interaction of interactions) {
            await this.cacheInteraction(interaction);
        }
        await this.setTypeInteractionIds(cacheKey, interactions.map(i => i.id));

        return interactions.map(i => this.mapToResponseDto(i));
    }

    /**
     * Get interaction analytics - Cache-first
     */
    async getInteractionAnalytics(filters: InteractionAnalyticsDto): Promise<any> {
        this.logger.log('Getting interaction analytics', 'UserInteractionsService');

        // Try cache first
        const cacheKey = `analytics:interaction_analytics:${JSON.stringify(filters)}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        // Queue analytics generation if not in cache
        await this.analyticsQueue.add('generate_interaction_analytics', {
            filters,
            cacheKey,
            timestamp: new Date().toISOString(),
        }, {
            delay: 1000,
        });

        // Return cached result or empty result
        return cached ? JSON.parse(cached) : {
            totalInteractions: 0,
            totalFormInteractions: 0,
            totalUserBehaviors: 0,
            topFormInteractionTypes: [],
            topBehaviorTypes: [],
            topPages: [],
            formCompletionRate: 0,
            errorRate: 0,
        };
    }

    /**
     * Bulk create interactions - Cache-first, queue-driven
     */
    async bulkCreateInteractions(interactions: CreateInteractionDto[]): Promise<number> {
        this.logger.log(`Bulk creating ${interactions.length} interactions`, 'UserInteractionsService');

        try {
            const createdInteractions: any[] = [];
            const timestamp = new Date().toISOString();

            // Create all interactions in cache first
            for (const dto of interactions) {
                const interactionId = this.generateSecureId();
                const interaction: any = {
                    id: interactionId,
                    sessionToken: dto.sessionToken,
                    interactionType: dto.interactionType,
                    behaviorType: dto.behaviorType || dto.interactionType,
                    fieldName: dto.fieldName,
                    elementId: dto.elementId,
                    elementClass: dto.elementClass,
                    elementText: dto.elementText,
                    coordinates: dto.coordinates,
                    scrollPosition: dto.scrollPosition,
                    viewportSize: dto.viewportSize,
                    timestampMs: dto.timestampMs,
                    fieldFocusTime: dto.fieldFocusTime,
                    typingSpeed: dto.typingSpeed,
                    duration: dto.duration,
                    fieldCompleted: dto.fieldCompleted,
                    validationPassed: dto.validationPassed,
                    errorMessage: dto.errorMessage,
                    attemptsCount: dto.attemptsCount,
                    inputLength: dto.inputLength,
                    backspaceCount: dto.backspaceCount,
                    pasteDetected: dto.pasteDetected,
                    autocompleteUsed: dto.autocompleteUsed,
                    pageUrl: dto.pageUrl,
                    referrerUrl: dto.referrerUrl,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                };

                // Cache immediately
                await this.cacheInteraction(interaction);
                await this.cacheSessionInteraction(dto.sessionToken, interactionId);
                await this.cacheTypeInteraction(dto.interactionType, interactionId);

                createdInteractions.push(interaction);
            }

            // Queue bulk database write
            await this.analyticsQueue.add('bulk_interactions_created', {
                interactions: createdInteractions,
                timestamp,
            }, {
                delay: 2000, // 2 second delay
            });

            this.logger.log(`Bulk created ${createdInteractions.length} interactions in cache and queued`, 'UserInteractionsService');

            return createdInteractions.length;
        } catch (error) {
            this.logger.error(`Failed to bulk create interactions: ${error.message}`, 'UserInteractionsService', error);
            throw new BadRequestException('Failed to bulk create interactions');
        }
    }

    /**
     * Cache interaction data
     */
    private async cacheInteraction(interaction: any): Promise<void> {
        try {
            const cacheKey = `${this.INTERACTION_CACHE_PREFIX}${interaction.id}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(interaction));
        } catch (error) {
            this.logger.warn(`Failed to cache interaction: ${error.message}`, 'UserInteractionsService');
        }
    }

    /**
     * Get interaction from cache
     */
    private async getInteractionFromCache(interactionId: string): Promise<any | null> {
        try {
            const cacheKey = `${this.INTERACTION_CACHE_PREFIX}${interactionId}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get interaction from cache: ${error.message}`, 'UserInteractionsService');
            return null;
        }
    }

    /**
     * Cache session interaction mapping
     */
    private async cacheSessionInteraction(sessionToken: string, interactionId: string): Promise<void> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionToken}`;
            const existingIds = await this.getSessionInteractionIds(sessionToken);
            const updatedIds = existingIds ? [...existingIds, interactionId] : [interactionId];
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(updatedIds));
        } catch (error) {
            this.logger.warn(`Failed to cache session interaction: ${error.message}`, 'UserInteractionsService');
        }
    }

    /**
     * Get session interaction IDs
     */
    private async getSessionInteractionIds(sessionToken: string): Promise<string[] | null> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionToken}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get session interaction IDs: ${error.message}`, 'UserInteractionsService');
            return null;
        }
    }

    /**
     * Cache session interaction IDs
     */
    private async cacheSessionInteractionIds(sessionToken: string, interactionIds: string[]): Promise<void> {
        try {
            const cacheKey = `${this.SESSION_CACHE_PREFIX}${sessionToken}`;
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(interactionIds));
        } catch (error) {
            this.logger.warn(`Failed to cache session interaction IDs: ${error.message}`, 'UserInteractionsService');
        }
    }

    /**
     * Cache type interaction mapping
     */
    private async cacheTypeInteraction(interactionType: string, interactionId: string): Promise<void> {
        try {
            const cacheKey = `${this.TYPE_CACHE_PREFIX}${interactionType}`;
            const existingIds = await this.getTypeInteractionIds(cacheKey);
            const updatedIds = existingIds ? [...existingIds, interactionId] : [interactionId];
            await this.setTypeInteractionIds(cacheKey, updatedIds);
        } catch (error) {
            this.logger.warn(`Failed to cache type interaction: ${error.message}`, 'UserInteractionsService');
        }
    }

    /**
     * Get type interaction IDs
     */
    private async getTypeInteractionIds(cacheKey: string): Promise<string[] | null> {
        try {
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to get type interaction IDs: ${error.message}`, 'UserInteractionsService');
            return null;
        }
    }

    /**
     * Set type interaction IDs
     */
    private async setTypeInteractionIds(cacheKey: string, interactionIds: string[]): Promise<void> {
        try {
            await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(interactionIds));
        } catch (error) {
            this.logger.warn(`Failed to set type interaction IDs: ${error.message}`, 'UserInteractionsService');
        }
    }

    /**
     * Generate secure interaction ID for cache storage
     */
    private generateSecureId(): string {
        return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Map to response DTO
     */
    private mapToResponseDto(interaction: any): InteractionResponseDto {
        if ('fieldName' in interaction) {
            // FormInteraction
            return {
                id: interaction.id,
                sessionToken: interaction.sessionToken,
                fieldName: interaction.fieldName,
                interactionType: interaction.interactionType,
                behaviorType: null,
                elementId: null,
                elementClass: null,
                elementText: null,
                coordinates: null,
                scrollPosition: null,
                viewportSize: null,
                timestampMs: Number(interaction.timestampMs),
                fieldFocusTime: interaction.fieldFocusTime,
                typingSpeed: interaction.typingSpeed,
                duration: null,
                fieldCompleted: interaction.fieldCompleted,
                validationPassed: interaction.validationPassed,
                errorMessage: interaction.errorMessage,
                attemptsCount: interaction.attemptsCount,
                inputLength: interaction.inputLength,
                backspaceCount: interaction.backspaceCount,
                pasteDetected: interaction.pasteDetected,
                autocompleteUsed: interaction.autocompleteUsed,
                pageUrl: null,
                referrerUrl: null,
                createdAt: interaction.createdAt,
            };
        } else {
            // UserBehavior
            return {
                id: interaction.id,
                sessionToken: interaction.sessionToken,
                fieldName: null,
                interactionType: interaction.behaviorType, // Use behaviorType as interactionType
                behaviorType: interaction.behaviorType,
                elementId: interaction.elementId,
                elementClass: interaction.elementClass,
                elementText: interaction.elementText,
                coordinates: interaction.coordinates,
                scrollPosition: interaction.scrollPosition,
                viewportSize: interaction.viewportSize,
                timestampMs: Number(interaction.timestampMs),
                fieldFocusTime: null,
                typingSpeed: null,
                duration: interaction.duration,
                fieldCompleted: null,
                validationPassed: null,
                errorMessage: null,
                attemptsCount: null,
                inputLength: null,
                backspaceCount: null,
                pasteDetected: null,
                autocompleteUsed: null,
                pageUrl: interaction.pageUrl,
                referrerUrl: interaction.referrerUrl,
                createdAt: interaction.createdAt,
            };
        }
    }
} 