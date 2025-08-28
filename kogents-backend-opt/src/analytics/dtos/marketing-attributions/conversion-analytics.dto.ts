import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsArray } from 'class-validator';

export class ConversionAnalyticsDto {
    @ApiPropertyOptional({ description: 'Start date for analytics' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'End date for analytics' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'UTM source filter' })
    @IsOptional()
    @IsString()
    utmSource?: string;

    @ApiPropertyOptional({ description: 'UTM medium filter' })
    @IsOptional()
    @IsString()
    utmMedium?: string;

    @ApiPropertyOptional({ description: 'UTM campaign filter' })
    @IsOptional()
    @IsString()
    utmCampaign?: string;

    @ApiPropertyOptional({ description: 'User ID filter' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'Device type filter' })
    @IsOptional()
    @IsString()
    deviceType?: string;

    @ApiPropertyOptional({ description: 'Country filter' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ description: 'City filter' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'Minimum conversion value' })
    @IsOptional()
    @IsNumber()
    minConversionValue?: number;

    @ApiPropertyOptional({ description: 'Maximum conversion value' })
    @IsOptional()
    @IsNumber()
    maxConversionValue?: number;

    @ApiPropertyOptional({ description: 'Minimum ROI' })
    @IsOptional()
    @IsNumber()
    minRoi?: number;

    @ApiPropertyOptional({ description: 'Maximum ROI' })
    @IsOptional()
    @IsNumber()
    maxRoi?: number;

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