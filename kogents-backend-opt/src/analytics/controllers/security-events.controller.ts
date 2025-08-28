import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SecurityEventsService } from '../services/security-events.service';
import {
    CreateSecurityEventDto,
    UpdateSecurityEventDto,
    SecurityEventResponseDto,
    SecurityEventAnalyticsDto
} from '../dtos/security-events';

@ApiTags('Analytics - Security Events')
@Controller('analytics/security-events')
export class SecurityEventsController {
    constructor(
        private readonly securityEventsService: SecurityEventsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create security event' })
    @ApiResponse({ status: 201, description: 'Security event created successfully', type: SecurityEventResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createSecurityEvent(@Body() dto: CreateSecurityEventDto): Promise<SecurityEventResponseDto> {
        return this.securityEventsService.createSecurityEvent(dto);
    }

    @Get(':eventId')
    @ApiOperation({ summary: 'Get security event by ID' })
    @ApiResponse({ status: 200, description: 'Security event retrieved successfully', type: SecurityEventResponseDto })
    @ApiResponse({ status: 404, description: 'Security event not found' })
    async getSecurityEvent(@Param('eventId') eventId: string): Promise<SecurityEventResponseDto> {
        return this.securityEventsService.getSecurityEvent(eventId);
    }

    @Put(':eventId')
    @ApiOperation({ summary: 'Update security event' })
    @ApiResponse({ status: 200, description: 'Security event updated successfully', type: SecurityEventResponseDto })
    @ApiResponse({ status: 404, description: 'Security event not found' })
    async updateSecurityEvent(
        @Param('eventId') eventId: string,
        @Body() dto: UpdateSecurityEventDto,
    ): Promise<SecurityEventResponseDto> {
        return this.securityEventsService.updateSecurityEvent(eventId, dto);
    }

    @Get('session/:sessionToken')
    @ApiOperation({ summary: 'Get security events by session token' })
    @ApiResponse({ status: 200, description: 'Security events retrieved successfully', type: [SecurityEventResponseDto] })
    async getSecurityEventsBySession(@Param('sessionToken') sessionToken: string): Promise<SecurityEventResponseDto[]> {
        return this.securityEventsService.getSecurityEventsByUser(sessionToken);
    }

    @Get('type/:eventType')
    @ApiOperation({ summary: 'Get security events by event type' })
    @ApiResponse({ status: 200, description: 'Security events retrieved successfully', type: [SecurityEventResponseDto] })
    async getSecurityEventsByType(@Param('eventType') eventType: string): Promise<SecurityEventResponseDto[]> {
        return this.securityEventsService.getSecurityEventsByType(eventType);
    }

    @Get('severity/:severity')
    @ApiOperation({ summary: 'Get security events by severity' })
    @ApiResponse({ status: 200, description: 'Security events retrieved successfully', type: [SecurityEventResponseDto] })
    async getSecurityEventsBySeverity(@Param('severity') severity: string): Promise<SecurityEventResponseDto[]> {
        return this.securityEventsService.getSecurityEventsBySeverity(severity);
    }

    @Post('analytics')
    @ApiOperation({ summary: 'Get security analytics' })
    @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
    async getSecurityAnalytics(@Body() dto: SecurityEventAnalyticsDto): Promise<any> {
        return this.securityEventsService.getSecurityEventAnalytics(dto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Bulk create security events' })
    @ApiResponse({ status: 201, description: 'Security events created successfully' })
    async bulkCreateSecurityEvents(@Body() events: CreateSecurityEventDto[]): Promise<{ count: number }> {
        const count = await this.securityEventsService.bulkCreateSecurityEvents(events);
        return { count };
    }
} 