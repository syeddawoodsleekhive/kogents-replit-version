import { IsNotEmpty, IsString, IsOptional, IsIn, IsNumber, Min, Max, IsIP, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
    @ApiProperty({
        description: 'IP address of the user',
        example: '192.168.1.1',
        type: String
    })
    @IsNotEmpty({ message: 'IP address is required' })
    @IsIP(4, { message: 'Invalid IP address format' })
    ipAddress: string;

    @ApiProperty({
        description: 'User agent string',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'User agent must be a string' })
    userAgent?: string;

    @ApiProperty({
        description: 'Device fingerprint for tracking',
        example: 'fp_1234567890abcdef',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Device fingerprint must be a string' })
    deviceFingerprint?: string;

    @ApiProperty({
        description: 'Country code',
        example: 'US',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Country must be a string' })
    country?: string;

    @ApiProperty({
        description: 'City name',
        example: 'New York',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'City must be a string' })
    city?: string;

    @ApiProperty({
        description: 'Timezone',
        example: 'America/New_York',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Timezone must be a string' })
    timezone?: string;

    @ApiProperty({
        description: 'Device type',
        example: 'desktop',
        enum: ['desktop', 'mobile', 'tablet', 'other']
    })
    @IsOptional()
    @IsIn(['desktop', 'mobile', 'tablet', 'other'], { message: 'Invalid device type' })
    deviceType?: string;

    @ApiProperty({
        description: 'Browser name',
        example: 'Chrome',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Browser must be a string' })
    browser?: string;

    @ApiProperty({
        description: 'Operating system',
        example: 'Windows',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'OS must be a string' })
    os?: string;

    @ApiProperty({
        description: 'Screen resolution',
        example: '1920x1080',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Screen resolution must be a string' })
    screenResolution?: string;

    @ApiProperty({
        description: 'Page load time in milliseconds',
        example: 1500,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Page load time must be a number' })
    @Min(0, { message: 'Page load time must be non-negative' })
    pageLoadTime?: number;

    @ApiProperty({
        description: 'Form interaction time in milliseconds',
        example: 3000,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Form interaction time must be a number' })
    @Min(0, { message: 'Form interaction time must be non-negative' })
    formInteractionTime?: number;

    @ApiProperty({
        description: 'Total session time in milliseconds',
        example: 45000,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Total session time must be a number' })
    @Min(0, { message: 'Total session time must be non-negative' })
    totalSessionTime?: number;

    @ApiProperty({
        description: 'Risk score (0-100)',
        example: 25,
        type: Number,
        minimum: 0,
        maximum: 100
    })
    @IsOptional()
    @IsNumber({}, { message: 'Risk score must be a number' })
    @Min(0, { message: 'Risk score must be at least 0' })
    @Max(100, { message: 'Risk score must be at most 100' })
    riskScore?: number;

    @ApiProperty({
        description: 'Whether VPN was detected',
        example: false,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'VPN detection must be a boolean' })
    isVpn?: boolean;

    @ApiProperty({
        description: 'Whether Tor was detected',
        example: false,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'Tor detection must be a boolean' })
    isTor?: boolean;

    @ApiProperty({
        description: 'Whether proxy was detected',
        example: false,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'Proxy detection must be a boolean' })
    isProxy?: boolean;
} 