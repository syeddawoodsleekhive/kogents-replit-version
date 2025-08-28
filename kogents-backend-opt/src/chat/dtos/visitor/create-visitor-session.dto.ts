import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class PageTrackingDto {
    @ApiProperty({
        description: 'Page URL',
        example: 'https://example.com/contact'
    })
    @IsString()
    pageUrl: string;

    @ApiPropertyOptional({
        description: 'Page title',
        example: 'Contact Us - Example Company'
    })
    @IsOptional()
    @IsString()
    pageTitle?: string;

    @ApiPropertyOptional({
        description: 'Page path',
        example: '/contact'
    })
    @IsOptional()
    @IsString()
    pagePath?: string;

    @ApiPropertyOptional({
        description: 'URL hash fragment',
        example: '#section1'
    })
    @IsOptional()
    @IsString()
    pageHash?: string;

    @ApiPropertyOptional({
        description: 'URL query parameters',
        example: 'utm_source=google&utm_campaign=summer2024'
    })
    @IsOptional()
    @IsString()
    pageQuery?: string;

    @ApiPropertyOptional({
        description: 'Time spent on page in seconds',
        example: 45
    })
    @IsOptional()
    @IsNumber()
    timeOnPage?: number;

    @ApiPropertyOptional({
        description: 'Page load time in milliseconds',
        example: 1200
    })
    @IsOptional()
    @IsNumber()
    pageLoadTime?: number;

    @ApiPropertyOptional({
        description: 'Navigation method',
        example: 'click',
        enum: ['click', 'back', 'forward', 'direct', 'search']
    })
    @IsOptional()
    @IsString()
    navigationMethod?: string;

    @ApiPropertyOptional({
        description: 'Navigation source',
        example: 'internal',
        enum: ['internal', 'external', 'search', 'social', 'direct']
    })
    @IsOptional()
    @IsString()
    navigationSource?: string;

    @ApiPropertyOptional({
        description: 'Navigation intent',
        example: 'browse',
        enum: ['browse', 'search', 'purchase', 'support']
    })
    @IsOptional()
    @IsString()
    navigationIntent?: string;
}

export class CreateVisitorSessionDto {
    // Required fields for both tables
    @ApiProperty({
        description: 'Visitor ID from frontend widget',
        example: 'vis_1234567890abcdef'
    })
    @IsString()
    visitor_id: string;

    @ApiProperty({
        description: 'Workspace ID',
        example: 'ws_1234567890abcdef'
    })
    @IsString()
    workspaceId: string;

    // Visitor identity fields (optional)
    @ApiPropertyOptional({
        description: 'Visitor email address',
        example: 'visitor@example.com'
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({
        description: 'Visitor name',
        example: 'John Doe'
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Visitor phone number',
        example: '+1234567890'
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        description: 'Visitor avatar URL',
        example: 'https://example.com/avatar.jpg'
    })
    @IsOptional()
    @IsString()
    avatarUrl?: string;

    // Visitor metadata (optional)
    @ApiPropertyOptional({
        description: 'Custom metadata for the visitor',
        example: { source: 'widget', campaign: 'summer2024' }
    })
    @IsOptional()
    @IsObject()
    metadata?: any;

    // Page tracking data (optional)
    @ApiPropertyOptional({
        description: 'Page tracking information',
        type: PageTrackingDto
    })
    @IsOptional()
    pageTracking?: PageTrackingDto;

    @ApiPropertyOptional({
        description: 'User agent string',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    @IsOptional()
    @IsString()
    userAgent?: string;

    @ApiPropertyOptional({
        description: 'Visitor IP address',
        example: '192.168.1.1'
    })
    @IsOptional()
    @IsString()
    ipAddress?: string;

    @ApiPropertyOptional({
        description: 'Device information',
        example: {
            screen: { width: 1920, height: 1080 },
            viewport: { width: 1920, height: 937 },
            deviceType: 'desktop',
            os: 'Windows 10',
            browser: 'Chrome'
        }
    })
    @IsOptional()
    @IsObject()
    deviceInfo?: any;

    @ApiPropertyOptional({
        description: 'Device fingerprint data',
        example: {
            canvas: 'canvas_fingerprint_hash',
            webgl: 'webgl_fingerprint_hash',
            audio: 'audio_fingerprint_hash',
            fonts: ['Arial', 'Helvetica'],
            plugins: ['Chrome PDF Plugin', 'Chrome PDF Viewer']
        }
    })
    @IsOptional()
    @IsObject()
    deviceFingerprint?: any;

    @ApiPropertyOptional({
        description: 'Host name',
        example: 'example.com'
    })
    @IsOptional()
    @IsString()
    hostName?: string;

    @ApiPropertyOptional({
        description: 'Browser information',
        example: 'Chrome 120.0.0.0'
    })
    @IsOptional()
    @IsString()
    browser?: string;

    @ApiPropertyOptional({
        description: 'Geographic location data',
        example: {
            country: 'US',
            city: 'New York',
            region: 'NY',
            timezone: 'America/New_York',
            coordinates: { lat: 40.7128, lng: -74.0060 }
        }
    })
    @IsOptional()
    @IsObject()
    location?: any;

    @ApiPropertyOptional({
        description: 'Comprehensive referrer tracking data',
        example: {
            referrer: {
                referrer: "https://www.google.com/",
                currentUrl: "https://www.logoin60.com/?gad_source=1&gad_campaignid=22785662155&gbraid=0AAAAADBM8jF5Z_b2k9nOtgeSg0xN6PUxX&gclid=EAIaIQobChMI49j1xqLYjgMV9NNEBx2D9ybTEAAYASAAEgL5XfD_BwE",
                domain: "google.com",
                isFirstVisit: true,
                timestamp: "2025-07-25T14:57:36.501Z",
                utm: {
                    source: null,
                    medium: null,
                    campaign: null,
                    term: null,
                    content: null
                },
                tracking: {
                    gclid: "EAIaIQobChMI49j1xqLYjgMV9NNEBx2D9ybTEAAYASAAEgL5XfD_BwE",
                    fbclid: null,
                    msclkid: null,
                    ttclid: null,
                    li_fat_id: null
                },
                landingPage: "https://www.logoin60.com/?gad_source=1&gad_campaignid=22785662155&gbraid=0AAAAADBM8jF5Z_b2k9nOtgeSg0xN6PUxX&gclid=EAIaIQobChMI49j1xqLYjgMV9NNEBx2D9ybTEAAYASAAEgL5XfD_BwE",
                sessionReferrer: "https://www.google.com/",
                referrerPolicy: "default",
                protocolDowngrade: false
            },
            trafficSource: {
                type: "paid_search",
                category: "paid",
                source: "google"
            },
            campaignData: {
                source: "google",
                medium: null,
                campaign: null,
                term: null,
                content: null,
                gclid: "EAIaIQobChMI49j1xqLYjgMV9NNEBx2D9ybTEAAYASAAEgL5XfD_BwE",
                fbclid: null,
                msclkid: null,
                ttclid: null,
                li_fat_id: null,
                trafficSource: "paid_search",
                category: "paid"
            },
            timestamp: "2025-07-25T14:57:39.412Z",
            source: "parent-site"
        }
    })
    @IsOptional()
    @IsObject()
    referrerData?: any;

    // Session state (optional)
    @ApiPropertyOptional({
        description: 'Session status',
        example: 'ACTIVE',
        enum: ['ACTIVE', 'IDLE', 'AWAY', 'INCOMING', 'CURRENTLY_SERVED', 'PENDING_TRANSFER', 'PENDING_INVITE']
    })
    @IsOptional()
    @IsString()
    status?: string;

    // Timing fields (optional)
    @ApiPropertyOptional({
        description: 'Session start time',
        example: '2025-07-25T14:57:36.501Z'
    })
    @IsOptional()
    @IsDateString()
    startedAt?: string;

    @ApiPropertyOptional({
        description: 'Session end time',
        example: '2025-07-25T15:30:00.000Z'
    })
    @IsOptional()
    @IsDateString()
    endedAt?: string;

    @ApiPropertyOptional({
        description: 'Last activity timestamp',
        example: '2025-07-25T15:25:30.000Z'
    })
    @IsOptional()
    @IsDateString()
    lastActivityAt?: string;
}