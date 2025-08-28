import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserInteractionsService } from '../services/user-interactions.service';
import {
    CreateInteractionDto,
    UpdateInteractionDto,
    InteractionResponseDto,
    InteractionAnalyticsDto
} from '../dtos/user-interactions';

@ApiTags('Analytics - User Interactions')
@Controller('analytics/user-interactions')
export class UserInteractionsController {
    constructor(
        private readonly userInteractionsService: UserInteractionsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create user interaction' })
    @ApiResponse({ status: 201, description: 'Interaction created successfully', type: InteractionResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createInteraction(@Body() dto: CreateInteractionDto): Promise<InteractionResponseDto> {
        return this.userInteractionsService.createInteraction(dto);
    }

    @Get(':interactionId')
    @ApiOperation({ summary: 'Get user interaction by ID' })
    @ApiResponse({ status: 200, description: 'Interaction retrieved successfully', type: InteractionResponseDto })
    @ApiResponse({ status: 404, description: 'Interaction not found' })
    async getInteraction(@Param('interactionId') interactionId: string): Promise<InteractionResponseDto> {
        return this.userInteractionsService.getInteraction(interactionId);
    }

    @Put(':interactionId')
    @ApiOperation({ summary: 'Update user interaction' })
    @ApiResponse({ status: 200, description: 'Interaction updated successfully', type: InteractionResponseDto })
    @ApiResponse({ status: 404, description: 'Interaction not found' })
    async updateInteraction(
        @Param('interactionId') interactionId: string,
        @Body() dto: UpdateInteractionDto,
    ): Promise<InteractionResponseDto> {
        return this.userInteractionsService.updateInteraction(interactionId, dto);
    }

    @Get('session/:sessionToken')
    @ApiOperation({ summary: 'Get user interactions by session token' })
    @ApiResponse({ status: 200, description: 'Interactions retrieved successfully', type: [InteractionResponseDto] })
    async getUserInteractions(@Param('sessionToken') sessionToken: string): Promise<InteractionResponseDto[]> {
        return this.userInteractionsService.getUserInteractions(sessionToken);
    }

    @Get('type/:interactionType')
    @ApiOperation({ summary: 'Get user interactions by type' })
    @ApiResponse({ status: 200, description: 'Interactions retrieved successfully', type: [InteractionResponseDto] })
    async getInteractionsByType(@Param('interactionType') interactionType: string): Promise<InteractionResponseDto[]> {
        return this.userInteractionsService.getInteractionsByType(interactionType);
    }

    @Post('analytics')
    @ApiOperation({ summary: 'Get interaction analytics' })
    @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
    async getInteractionAnalytics(@Body() dto: InteractionAnalyticsDto): Promise<any> {
        return this.userInteractionsService.getInteractionAnalytics(dto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Bulk create user interactions' })
    @ApiResponse({ status: 201, description: 'Interactions created successfully' })
    async bulkCreateInteractions(@Body() interactions: CreateInteractionDto[]): Promise<{ count: number }> {
        const count = await this.userInteractionsService.bulkCreateInteractions(interactions);
        return { count };
    }
} 