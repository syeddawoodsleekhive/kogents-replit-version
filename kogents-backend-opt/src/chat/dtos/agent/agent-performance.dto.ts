import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum PerformancePeriod {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year'
}

export class GetAgentPerformanceDto {
    @ApiProperty({
        description: 'Agent ID',
        example: 'agent_1234567890abcdef'
    })
    @IsString()
    agentId: string;

    @ApiProperty({
        description: 'Workspace ID',
        example: 'ws_1234567890abcdef'
    })
    @IsString()
    workspaceId: string;

    @ApiPropertyOptional({
        description: 'Start date for performance metrics',
        example: '2024-01-01T00:00:00Z'
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'End date for performance metrics',
        example: '2024-01-31T23:59:59Z'
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Performance period',
        enum: PerformancePeriod,
        default: PerformancePeriod.MONTH,
        example: PerformancePeriod.MONTH
    })
    @IsOptional()
    @IsEnum(PerformancePeriod)
    period?: PerformancePeriod = PerformancePeriod.MONTH;
}

export class AgentPerformanceResponseDto {
    @ApiProperty({
        description: 'Agent ID',
        example: 'agent_1234567890abcdef'
    })
    agentId: string;

    @ApiProperty({
        description: 'Agent name',
        example: 'John Doe'
    })
    agentName: string;

    @ApiProperty({
        description: 'Agent email',
        example: 'john@example.com'
    })
    agentEmail: string;

    @ApiProperty({
        description: 'Total chats handled',
        example: 150
    })
    totalChats: number;

    @ApiProperty({
        description: 'Resolved chats',
        example: 145
    })
    resolvedChats: number;

    @ApiProperty({
        description: 'Average response time in seconds',
        example: 120
    })
    averageResponseTime: number;

    @ApiProperty({
        description: 'Average chat duration in minutes',
        example: 12.5
    })
    averageChatDuration: number;

    @ApiProperty({
        description: 'Total messages sent',
        example: 1250
    })
    totalMessages: number;

    @ApiProperty({
        description: 'Customer satisfaction score (1-5)',
        example: 4.5
    })
    satisfactionScore: number;

    @ApiProperty({
        description: 'Online hours',
        example: 160
    })
    onlineHours: number;

    @ApiProperty({
        description: 'Performance period',
        example: '2024-01-01 to 2024-01-31'
    })
    period: string;

    @ApiProperty({
        description: 'Daily performance statistics',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                date: { type: 'string', example: '2024-01-15' },
                chats: { type: 'number', example: 5 },
                messages: { type: 'number', example: 45 },
                responseTime: { type: 'number', example: 120 },
                satisfaction: { type: 'number', example: 4.5 }
            }
        }
    })
    dailyStats: Array<{
        date: string;
        chats: number;
        messages: number;
        responseTime: number;
        satisfaction: number;
    }>;
} 