import { IsOptional, IsString, IsIn, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSessionDto {
    @ApiProperty({
        description: 'Current step in registration process',
        example: 'workspace',
        enum: ['email', 'workspace', 'profile', 'verification', 'complete'],
        required: false
    })
    @IsOptional()
    @IsIn(['email', 'workspace', 'profile', 'verification', 'complete'], {
        message: 'Current step must be one of: email, workspace, profile, verification, complete'
    })
    currentStep?: string;

    @ApiProperty({
        description: 'Completion percentage (0-100)',
        example: 50,
        type: Number,
        minimum: 0,
        maximum: 100,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Completion percentage must be a number' })
    @Min(0, { message: 'Completion percentage must be at least 0' })
    @Max(100, { message: 'Completion percentage must be at most 100' })
    completionPercentage?: number;

    @ApiProperty({
        description: 'Page load time in milliseconds',
        example: 1200,
        type: Number,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Page load time must be a number' })
    @Min(0, { message: 'Page load time must be at least 0' })
    pageLoadTime?: number;

    @ApiProperty({
        description: 'Form interaction time in milliseconds',
        example: 5000,
        type: Number,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Form interaction time must be a number' })
    @Min(0, { message: 'Form interaction time must be at least 0' })
    formInteractionTime?: number;

    @ApiProperty({
        description: 'Total session time in milliseconds',
        example: 30000,
        type: Number,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Total session time must be a number' })
    @Min(0, { message: 'Total session time must be at least 0' })
    totalSessionTime?: number;

    @ApiProperty({
        description: 'Updated risk score (0-100)',
        example: 35,
        type: Number,
        minimum: 0,
        maximum: 100,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Risk score must be a number' })
    @Min(0, { message: 'Risk score must be at least 0' })
    @Max(100, { message: 'Risk score must be at most 100' })
    riskScore?: number;

    @ApiProperty({
        description: 'Whether user is using VPN',
        example: false,
        type: Boolean,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'isVpn must be a boolean' })
    isVpn?: boolean;

    @ApiProperty({
        description: 'Whether user is using Tor',
        example: false,
        type: Boolean,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'isTor must be a boolean' })
    isTor?: boolean;

    @ApiProperty({
        description: 'Whether user is using proxy',
        example: false,
        type: Boolean,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'isProxy must be a boolean' })
    isProxy?: boolean;

    @ApiProperty({
        description: 'Whether registration was successful',
        example: true,
        type: Boolean,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'registrationSuccessful must be a boolean' })
    registrationSuccessful?: boolean;

    @ApiProperty({
        description: 'Reason for registration failure',
        example: 'Email verification failed',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'failureReason must be a string' })
    failureReason?: string;

    @ApiProperty({
        description: 'Session completion timestamp',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'completedAt must be a valid date string' })
    completedAt?: string;

    @ApiProperty({
        description: 'Session abandonment timestamp',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'abandonedAt must be a valid date string' })
    abandonedAt?: string;
} 