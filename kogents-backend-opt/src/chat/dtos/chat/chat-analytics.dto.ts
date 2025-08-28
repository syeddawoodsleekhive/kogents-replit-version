import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum AnalyticsPeriod {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year'
}

export class GetChatAnalyticsDto {
    @ApiProperty({
        description: 'Workspace ID',
        example: 'ws_1234567890abcdef'
    })
    @IsString()
    workspaceId: string;

    @ApiPropertyOptional({
        description: 'Start date for analytics',
        example: '2024-01-01T00:00:00Z'
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'End date for analytics',
        example: '2024-01-31T23:59:59Z'
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Analytics period',
        enum: AnalyticsPeriod,
        default: AnalyticsPeriod.MONTH,
        example: AnalyticsPeriod.MONTH
    })
    @IsOptional()
    @IsEnum(AnalyticsPeriod)
    period?: AnalyticsPeriod = AnalyticsPeriod.MONTH;
}

export class ChatAnalyticsResponseDto {
    @ApiProperty({
        description: 'Workspace ID',
        example: 'ws_1234567890abcdef'
    })
    workspaceId: string;

    @ApiProperty({
        description: 'Total number of chat rooms',
        example: 1250
    })
    totalChats: number;

    @ApiProperty({
        description: 'Active chat rooms',
        example: 45
    })
    activeChats: number;

    @ApiProperty({
        description: 'Resolved chat rooms',
        example: 1205
    })
    resolvedChats: number;

    @ApiProperty({
        description: 'Average response time in seconds',
        example: 180
    })
    averageResponseTime: number;

    @ApiProperty({
        description: 'Average chat duration in minutes',
        example: 15.5
    })
    averageChatDuration: number;

    @ApiProperty({
        description: 'Total number of messages',
        example: 12500
    })
    totalMessages: number;

    @ApiProperty({
        description: 'Messages from visitors',
        example: 7500
    })
    visitorMessages: number;

    @ApiProperty({
        description: 'Messages from agents',
        example: 5000
    })
    agentMessages: number;

    @ApiProperty({
        description: 'Chat satisfaction score (1-5)',
        example: 4.2
    })
    satisfactionScore: number;

    @ApiProperty({
        description: 'Analytics period',
        example: '2024-01-01 to 2024-01-31'
    })
    period: string;

    @ApiProperty({
        description: 'Daily chat statistics',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                date: { type: 'string', example: '2024-01-15' },
                chats: { type: 'number', example: 45 },
                messages: { type: 'number', example: 450 },
                responseTime: { type: 'number', example: 180 }
            }
        }
    })
    dailyStats: Array<{
        date: string;
        chats: number;
        messages: number;
        responseTime: number;
    }>;
} 