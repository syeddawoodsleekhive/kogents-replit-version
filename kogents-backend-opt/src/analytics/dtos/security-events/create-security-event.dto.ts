import { IsNotEmpty, IsString, IsOptional, IsIn, IsNumber, Min, Max, IsIP, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSecurityEventDto {
    @ApiProperty({
        description: 'Session token to link security event',
        example: 'sess_1234567890abcdef',
        type: String
    })
    @IsNotEmpty({ message: 'Session token is required' })
    @IsString({ message: 'Session token must be a string' })
    sessionToken: string;

    @ApiProperty({
        description: 'Type of security event',
        example: 'login_attempt',
        enum: [
            'login_attempt',
            'suspicious_activity',
            'rate_limit_exceeded',
            'failed_verification',
            'multiple_sessions',
            'unusual_location',
            'vpn_detected',
            'tor_detected',
            'proxy_detected',
            'bot_activity',
            'brute_force_attempt',
            'account_takeover_attempt',
            'data_exfiltration_attempt',
            'malicious_payload',
            'sql_injection_attempt',
            'xss_attempt',
            'csrf_attempt',
            'privilege_escalation',
            'session_hijacking',
            'other'
        ]
    })
    @IsNotEmpty({ message: 'Event type is required' })
    @IsIn([
        'login_attempt',
        'suspicious_activity',
        'rate_limit_exceeded',
        'failed_verification',
        'multiple_sessions',
        'unusual_location',
        'vpn_detected',
        'tor_detected',
        'proxy_detected',
        'bot_activity',
        'brute_force_attempt',
        'account_takeover_attempt',
        'data_exfiltration_attempt',
        'malicious_payload',
        'sql_injection_attempt',
        'xss_attempt',
        'csrf_attempt',
        'privilege_escalation',
        'session_hijacking',
        'other'
    ], { message: 'Invalid event type' })
    eventType: string;

    @ApiProperty({
        description: 'Severity level of the security event',
        example: 'MEDIUM',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    })
    @IsOptional()
    @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { message: 'Severity must be LOW, MEDIUM, HIGH, or CRITICAL' })
    severity?: string;

    @ApiProperty({
        description: 'Description of the security event',
        example: 'Multiple failed login attempts detected from same IP',
        type: String
    })
    @IsNotEmpty({ message: 'Description is required' })
    @IsString({ message: 'Description must be a string' })
    description: string;

    @ApiProperty({
        description: 'IP address where the event occurred',
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
        description: 'Geographic location data',
        example: {
            country: 'US',
            city: 'New York',
            coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Location must be an object' })
    location?: Record<string, any>;

    @ApiProperty({
        description: 'Risk score (0-100)',
        example: 75,
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
        description: 'Array of threat indicators',
        example: [
            'multiple_failed_attempts',
            'unusual_timing',
            'known_malicious_ip'
        ],
        type: 'array',
        items: { type: 'string' }
    })
    @IsOptional()
    @IsObject({ message: 'Threat indicators must be an object' })
    threatIndicators?: Record<string, any>;

    @ApiProperty({
        description: 'Array of mitigation actions taken',
        example: [
            'rate_limited',
            'ip_blocked',
            'session_terminated'
        ],
        type: 'array',
        items: { type: 'string' }
    })
    @IsOptional()
    @IsObject({ message: 'Mitigation actions must be an object' })
    mitigationActions?: Record<string, any>;

    @ApiProperty({
        description: 'Additional metadata for the security event',
        example: {
            failedAttempts: 5,
            timeWindow: '5 minutes',
            blockedDuration: '1 hour'
        },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Metadata must be an object' })
    metadata?: Record<string, any>;
} 