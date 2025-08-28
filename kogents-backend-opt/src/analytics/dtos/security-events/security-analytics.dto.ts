import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsArray } from 'class-validator';

export class SecurityAnalyticsDto {
    @ApiPropertyOptional({ description: 'Start date for analytics' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'End date for analytics' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Event type filter' })
    @IsOptional()
    @IsString()
    eventType?: string;

    @ApiPropertyOptional({ description: 'Severity level filter' })
    @IsOptional()
    @IsString()
    severity?: string;

    @ApiPropertyOptional({ description: 'IP address filter' })
    @IsOptional()
    @IsString()
    ipAddress?: string;

    @ApiPropertyOptional({ description: 'User ID filter' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'Country filter' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ description: 'City filter' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'Threat level filter' })
    @IsOptional()
    @IsString()
    threatLevel?: string;

    @ApiPropertyOptional({ description: 'Attack type filter' })
    @IsOptional()
    @IsString()
    attackType?: string;

    @ApiPropertyOptional({ description: 'Whether blocked events only' })
    @IsOptional()
    @IsString()
    blocked?: string;

    @ApiPropertyOptional({ description: 'Whether false positives only' })
    @IsOptional()
    @IsString()
    falsePositive?: string;

    @ApiPropertyOptional({ description: 'Whether reviewed events only' })
    @IsOptional()
    @IsString()
    reviewed?: string;

    @ApiPropertyOptional({ description: 'Minimum risk score' })
    @IsOptional()
    @IsNumber()
    minRiskScore?: number;

    @ApiPropertyOptional({ description: 'Maximum risk score' })
    @IsOptional()
    @IsNumber()
    maxRiskScore?: number;

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