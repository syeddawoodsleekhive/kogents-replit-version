import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
    @ApiProperty({
        description: 'Unique session ID',
        example: 'clx1234567890abcdef',
        type: String
    })
    id: string;

    @ApiProperty({
        description: 'Unique session token',
        example: 'sess_1234567890abcdef',
        type: String
    })
    sessionToken: string;

    @ApiProperty({
        description: 'IP address of the user',
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
        description: 'Session start time',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        format: 'date-time'
    })
    startedAt: Date;

    @ApiProperty({
        description: 'Session completion time',
        example: '2024-01-15T10:35:00.000Z',
        type: String,
        format: 'date-time',
        nullable: true
    })
    completedAt: Date | null;

    @ApiProperty({
        description: 'Session abandonment time',
        example: '2024-01-15T10:32:00.000Z',
        type: String,
        format: 'date-time',
        nullable: true
    })
    abandonedAt: Date | null;

    @ApiProperty({
        description: 'Current step in registration process',
        example: 'workspace',
        type: String
    })
    currentStep: string;

    @ApiProperty({
        description: 'Total number of steps',
        example: 4,
        type: Number
    })
    totalSteps: number;

    @ApiProperty({
        description: 'Completion percentage (0-100)',
        example: 50,
        type: Number
    })
    completionPercentage: number;

    @ApiProperty({
        description: 'Page load time in milliseconds',
        example: 1200,
        type: Number,
        nullable: true
    })
    pageLoadTime: number | null;

    @ApiProperty({
        description: 'Form interaction time in milliseconds',
        example: 5000,
        type: Number,
        nullable: true
    })
    formInteractionTime: number | null;

    @ApiProperty({
        description: 'Total session time in milliseconds',
        example: 30000,
        type: Number,
        nullable: true
    })
    totalSessionTime: number | null;

    @ApiProperty({
        description: 'Country code (ISO 3166-1 alpha-2)',
        example: 'US',
        type: String,
        nullable: true
    })
    country: string | null;

    @ApiProperty({
        description: 'City name',
        example: 'New York',
        type: String,
        nullable: true
    })
    city: string | null;

    @ApiProperty({
        description: 'Timezone identifier',
        example: 'America/New_York',
        type: String,
        nullable: true
    })
    timezone: string | null;

    @ApiProperty({
        description: 'Device type',
        example: 'desktop',
        type: String,
        nullable: true
    })
    deviceType: string | null;

    @ApiProperty({
        description: 'Browser name',
        example: 'Chrome',
        type: String,
        nullable: true
    })
    browser: string | null;

    @ApiProperty({
        description: 'Operating system',
        example: 'Windows',
        type: String,
        nullable: true
    })
    os: string | null;

    @ApiProperty({
        description: 'Screen resolution',
        example: '1920x1080',
        type: String,
        nullable: true
    })
    screenResolution: string | null;

    @ApiProperty({
        description: 'Risk score (0-100)',
        example: 25,
        type: Number
    })
    riskScore: number;

    @ApiProperty({
        description: 'Whether user is using VPN',
        example: false,
        type: Boolean
    })
    isVpn: boolean;

    @ApiProperty({
        description: 'Whether user is using Tor',
        example: false,
        type: Boolean
    })
    isTor: boolean;

    @ApiProperty({
        description: 'Whether user is using proxy',
        example: false,
        type: Boolean
    })
    isProxy: boolean;

    @ApiProperty({
        description: 'Whether registration was successful',
        example: true,
        type: Boolean
    })
    registrationSuccessful: boolean;

    @ApiProperty({
        description: 'Reason for failure if registration was not successful',
        example: 'Email verification failed',
        type: String,
        nullable: true
    })
    failureReason: string | null;

    @ApiProperty({
        description: 'Session creation time',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        format: 'date-time'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Session last update time',
        example: '2024-01-15T10:35:00.000Z',
        type: String,
        format: 'date-time'
    })
    updatedAt: Date;
} 