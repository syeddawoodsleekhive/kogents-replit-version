import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsArray } from 'class-validator';

export class InteractionAnalyticsDto {
    @ApiPropertyOptional({ description: 'Start date for analytics' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'End date for analytics' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Session token filter' })
    @IsOptional()
    @IsString()
    sessionToken?: string;

    @ApiPropertyOptional({ description: 'Interaction type filter' })
    @IsOptional()
    @IsString()
    interactionType?: string;

    @ApiPropertyOptional({ description: 'Behavior type filter' })
    @IsOptional()
    @IsString()
    behaviorType?: string;

    @ApiPropertyOptional({ description: 'Page URL filter' })
    @IsOptional()
    @IsString()
    pageUrl?: string;

    @ApiPropertyOptional({ description: 'Group by fields' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    groupBy?: string[];

    @ApiPropertyOptional({ description: 'Limit results' })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({ description: 'Offset for pagination' })
    @IsOptional()
    @IsNumber()
    offset?: number;
} 