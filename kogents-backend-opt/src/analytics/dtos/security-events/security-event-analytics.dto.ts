import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SecurityEventAnalyticsDto {
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
        description: 'Filter by event type',
        example: 'login_attempt',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Event type must be a string' })
    eventType?: string;

    @ApiProperty({
        description: 'Filter by severity level',
        example: 'HIGH',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Severity must be a string' })
    severity?: string;

    @ApiProperty({
        description: 'Filter by IP address',
        example: '192.168.1.1',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'IP address must be a string' })
    ipAddress?: string;

    @ApiProperty({
        description: 'Filter by session token',
        example: 'sess_1234567890abcdef',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Session token must be a string' })
    sessionToken?: string;
} 