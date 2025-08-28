import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistrationSessionsService } from '../services/registration-sessions.service';
import {
    CreateSessionDto,
    UpdateSessionDto,
    SessionResponseDto,
    SessionAnalyticsDto
} from '../dtos/registration-sessions';

@ApiTags('Analytics - Registration Sessions')
@Controller('analytics/registration-sessions')
export class RegistrationSessionsController {
    constructor(
        private readonly registrationSessionsService: RegistrationSessionsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create registration session' })
    @ApiResponse({ status: 201, description: 'Session created successfully', type: SessionResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createSession(@Body() dto: CreateSessionDto): Promise<SessionResponseDto> {
        return this.registrationSessionsService.createSession(dto);
    }

    @Get(':sessionToken')
    @ApiOperation({ summary: 'Get registration session by token' })
    @ApiResponse({ status: 200, description: 'Session retrieved successfully', type: SessionResponseDto })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getSession(@Param('sessionToken') sessionToken: string): Promise<SessionResponseDto> {
        return this.registrationSessionsService.getSession(sessionToken);
    }

    @Put(':sessionToken')
    @ApiOperation({ summary: 'Update registration session' })
    @ApiResponse({ status: 200, description: 'Session updated successfully', type: SessionResponseDto })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async updateSession(
        @Param('sessionToken') sessionToken: string,
        @Body() dto: UpdateSessionDto,
    ): Promise<SessionResponseDto> {
        return this.registrationSessionsService.updateSession(sessionToken, dto);
    }

    @Get('ip/:ipAddress')
    @ApiOperation({ summary: 'Get sessions by IP address' })
    @ApiResponse({ status: 200, description: 'Sessions retrieved successfully', type: [SessionResponseDto] })
    async getSessionsByIp(@Param('ipAddress') ipAddress: string): Promise<SessionResponseDto[]> {
        return this.registrationSessionsService.getSessionsByIp(ipAddress);
    }

    @Get('status/:status')
    @ApiOperation({ summary: 'Get sessions by status' })
    @ApiResponse({ status: 200, description: 'Sessions retrieved successfully', type: [SessionResponseDto] })
    async getSessionsByStatus(
        @Param('status') status: 'successful' | 'pending' | 'failed',
    ): Promise<SessionResponseDto[]> {
        return this.registrationSessionsService.getSessionsByStatus(status);
    }

    @Post('analytics')
    @ApiOperation({ summary: 'Get session analytics' })
    @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
    async getSessionAnalytics(@Body() dto: SessionAnalyticsDto): Promise<any> {
        return this.registrationSessionsService.getSessionAnalytics(dto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Bulk create registration sessions' })
    @ApiResponse({ status: 201, description: 'Sessions created successfully' })
    async bulkCreateSessions(@Body() sessions: CreateSessionDto[]): Promise<{ count: number }> {
        const count = await this.registrationSessionsService.bulkCreateSessions(sessions);
        return { count };
    }
} 