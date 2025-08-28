import { ApiProperty } from '@nestjs/swagger';

export class AttributionResponseDto {
    @ApiProperty({
        description: 'Unique attribution ID',
        example: 'clx1234567890abcdef',
        type: String
    })
    id: string;

    @ApiProperty({
        description: 'Session token linked to this attribution',
        example: 'sess_1234567890abcdef',
        type: String
    })
    sessionToken: string;

    @ApiProperty({
        description: 'Referrer URL',
        example: 'https://google.com',
        type: String,
        nullable: true
    })
    referrerUrl: string | null;

    @ApiProperty({
        description: 'UTM source parameter',
        example: 'google',
        type: String,
        nullable: true
    })
    utmSource: string | null;

    @ApiProperty({
        description: 'UTM medium parameter',
        example: 'cpc',
        type: String,
        nullable: true
    })
    utmMedium: string | null;

    @ApiProperty({
        description: 'UTM campaign parameter',
        example: 'summer_sale',
        type: String,
        nullable: true
    })
    utmCampaign: string | null;

    @ApiProperty({
        description: 'UTM term parameter',
        example: 'chat+app',
        type: String,
        nullable: true
    })
    utmTerm: string | null;

    @ApiProperty({
        description: 'UTM content parameter',
        example: 'banner_ad',
        type: String,
        nullable: true
    })
    utmContent: string | null;

    @ApiProperty({
        description: 'Landing page URL',
        example: 'https://app.kogents.com/signup',
        type: String,
        nullable: true
    })
    landingPage: string | null;

    @ApiProperty({
        description: 'Campaign ID from advertising platform',
        example: 'camp_123456789',
        type: String,
        nullable: true
    })
    campaignId: string | null;

    @ApiProperty({
        description: 'Ad group ID from advertising platform',
        example: 'ag_987654321',
        type: String,
        nullable: true
    })
    adGroupId: string | null;

    @ApiProperty({
        description: 'Keyword that triggered the ad',
        example: 'chat application',
        type: String,
        nullable: true
    })
    keyword: string | null;

    @ApiProperty({
        description: 'Google Click ID for tracking',
        example: 'gclid_1234567890abcdef',
        type: String,
        nullable: true
    })
    gclid: string | null;

    @ApiProperty({
        description: 'Facebook Click ID for tracking',
        example: 'fbclid_1234567890abcdef',
        type: String,
        nullable: true
    })
    fbclid: string | null;

    @ApiProperty({
        description: 'Conversion value in cents',
        example: 5000,
        type: Number,
        nullable: true
    })
    conversionValue: number | null;

    @ApiProperty({
        description: 'Currency for conversion value',
        example: 'USD',
        type: String,
        default: 'USD'
    })
    conversionCurrency: string;

    @ApiProperty({
        description: 'Attribution creation time',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        format: 'date-time'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Attribution last update time',
        example: '2024-01-15T10:35:00.000Z',
        type: String,
        format: 'date-time'
    })
    updatedAt: Date;
} 