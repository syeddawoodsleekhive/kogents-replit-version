import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SessionAnalyticsDto {
    @ApiProperty({
        description: 'Start date for analytics (ISO string)',
        example: '2024-01-01T00:00:00.000Z',
        type: String,
        required: false
    })
    @IsOptional()
    @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
    startDate?: string;

    @ApiProperty({
        description: 'End date for analytics (ISO string)',
        example: '2024-12-31T23:59:59.999Z',
        type: String,
        required: false
    })
    @IsOptional()
    @IsDateString({}, { message: 'End date must be a valid ISO date string' })
    endDate?: string;

    @ApiProperty({
        description: 'Filter by country',
        example: 'US',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Country must be a string' })
    country?: string;

    @ApiProperty({
        description: 'Filter by device type',
        example: 'desktop',
        enum: ['desktop', 'mobile', 'tablet'],
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Device type must be a string' })
    deviceType?: string;

    @ApiProperty({
        description: 'Filter by UTM source',
        example: 'google',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'UTM source must be a string' })
    utmSource?: string;

    @ApiProperty({
        description: 'Filter by UTM campaign',
        example: 'summer_sale',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'UTM campaign must be a string' })
    utmCampaign?: string;
} 