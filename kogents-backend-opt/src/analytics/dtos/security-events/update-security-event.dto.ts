import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class UpdateSecurityEventDto {
    @ApiPropertyOptional({ description: 'Event severity level' })
    @IsOptional()
    @IsString()
    severity?: string;

    @ApiPropertyOptional({ description: 'Risk score' })
    @IsOptional()
    @IsNumber()
    riskScore?: number;

    @ApiPropertyOptional({ description: 'Threat indicators' })
    @IsOptional()
    @IsObject()
    threatIndicators?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Mitigation actions' })
    @IsOptional()
    @IsObject()
    mitigationActions?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
} 