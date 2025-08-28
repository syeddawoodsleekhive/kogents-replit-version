import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, IsBoolean, IsArray, IsObject } from 'class-validator';

export class UpdateAttributionDto {
    @ApiPropertyOptional({ description: 'Last touch date' })
    @IsOptional()
    @IsDateString()
    lastTouchDate?: string;

    @ApiPropertyOptional({ description: 'Number of touches' })
    @IsOptional()
    @IsNumber()
    touchCount?: number;

    @ApiPropertyOptional({ description: 'Conversion value' })
    @IsOptional()
    @IsNumber()
    conversionValue?: number;

    @ApiPropertyOptional({ description: 'Conversion currency' })
    @IsOptional()
    @IsString()
    conversionCurrency?: string;

    @ApiPropertyOptional({ description: 'Number of conversions' })
    @IsOptional()
    @IsNumber()
    conversions?: number;

    @ApiPropertyOptional({ description: 'Conversion rate' })
    @IsOptional()
    @IsNumber()
    conversionRate?: number;

    @ApiPropertyOptional({ description: 'Cost per conversion' })
    @IsOptional()
    @IsNumber()
    costPerConversion?: number;

    @ApiPropertyOptional({ description: 'Revenue' })
    @IsOptional()
    @IsNumber()
    revenue?: number;

    @ApiPropertyOptional({ description: 'Return on investment' })
    @IsOptional()
    @IsNumber()
    roi?: number;

    @ApiPropertyOptional({ description: 'Return on ad spend' })
    @IsOptional()
    @IsNumber()
    roas?: number;

    @ApiPropertyOptional({ description: 'Number of impressions' })
    @IsOptional()
    @IsNumber()
    impressions?: number;

    @ApiPropertyOptional({ description: 'Number of clicks' })
    @IsOptional()
    @IsNumber()
    clicks?: number;

    @ApiPropertyOptional({ description: 'Click-through rate' })
    @IsOptional()
    @IsNumber()
    ctr?: number;

    @ApiPropertyOptional({ description: 'Average cost per click' })
    @IsOptional()
    @IsNumber()
    avgCpc?: number;

    @ApiPropertyOptional({ description: 'Total cost' })
    @IsOptional()
    @IsNumber()
    cost?: number;

    @ApiPropertyOptional({ description: 'Quality score' })
    @IsOptional()
    @IsNumber()
    qualityScore?: number;
} 