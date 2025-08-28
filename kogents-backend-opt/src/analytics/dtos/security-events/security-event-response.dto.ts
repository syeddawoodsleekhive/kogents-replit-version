import { ApiProperty } from '@nestjs/swagger';

export class SecurityEventResponseDto {
    @ApiProperty({
        description: 'Unique security event ID',
        example: 'clx1234567890abcdef',
        type: String
    })
    id: string;

    @ApiProperty({
        description: 'Session token linked to this security event',
        example: 'sess_1234567890abcdef',
        type: String
    })
    sessionToken: string;

    @ApiProperty({
        description: 'Type of security event',
        example: 'login_attempt',
        type: String
    })
    eventType: string;

    @ApiProperty({
        description: 'Severity level of the security event',
        example: 'MEDIUM',
        type: String
    })
    severity: string;

    @ApiProperty({
        description: 'Description of the security event',
        example: 'Multiple failed login attempts detected from same IP',
        type: String
    })
    description: string;

    @ApiProperty({
        description: 'IP address where the event occurred',
        example: '192.168.1.1',
        type: String
    })
    ipAddress: string;

    @ApiProperty({
        description: 'User agent string',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        type: String,
        nullable: true
    })
    userAgent: string | null;

    @ApiProperty({
        description: 'Device fingerprint for tracking',
        example: 'fp_1234567890abcdef',
        type: String,
        nullable: true
    })
    deviceFingerprint: string | null;

    @ApiProperty({
        description: 'Geographic location data',
        example: {
            country: 'US',
            city: 'New York',
            coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        type: 'object',
        additionalProperties: true,
        nullable: true
    })
    location: Record<string, any> | null;

    @ApiProperty({
        description: 'Risk score (0-100)',
        example: 75,
        type: Number
    })
    riskScore: number;

    @ApiProperty({
        description: 'Array of threat indicators',
        example: [
            'multiple_failed_attempts',
            'unusual_timing',
            'known_malicious_ip'
        ],
        type: 'array',
        items: { type: 'string' },
        nullable: true
    })
    threatIndicators: Record<string, any> | null;

    @ApiProperty({
        description: 'Array of mitigation actions taken',
        example: [
            'rate_limited',
            'ip_blocked',
            'session_terminated'
        ],
        type: 'array',
        items: { type: 'string' },
        nullable: true
    })
    mitigationActions: Record<string, any> | null;

    @ApiProperty({
        description: 'Additional metadata for the security event',
        example: {
            failedAttempts: 5,
            timeWindow: '5 minutes',
            blockedDuration: '1 hour'
        },
        type: 'object',
        additionalProperties: true,
        nullable: true
    })
    metadata: Record<string, any> | null;

    @ApiProperty({
        description: 'Security event creation time',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        format: 'date-time'
    })
    createdAt: Date;
} 