import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUrl, IsIP, IsDecimal, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateAttributionDto {
    @ApiProperty({
        description: 'Session token to link attribution data',
        example: 'sess_1234567890abcdef',
        type: String
    })
    @IsNotEmpty({ message: 'Session token is required' })
    @IsString({ message: 'Session token must be a string' })
    sessionToken: string;

    @ApiProperty({
        description: 'UTM source parameter',
        example: 'google',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'UTM source must be a string' })
    utmSource?: string;

    @ApiProperty({
        description: 'UTM medium parameter',
        example: 'cpc',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'UTM medium must be a string' })
    utmMedium?: string;

    @ApiProperty({
        description: 'UTM campaign parameter',
        example: 'summer_sale',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'UTM campaign must be a string' })
    utmCampaign?: string;

    @ApiProperty({
        description: 'UTM term parameter',
        example: 'chat+app',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'UTM term must be a string' })
    utmTerm?: string;

    @ApiProperty({
        description: 'UTM content parameter',
        example: 'banner_ad',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'UTM content must be a string' })
    utmContent?: string;

    @ApiProperty({
        description: 'Referrer URL',
        example: 'https://google.com',
        type: String
    })
    @IsOptional()
    @IsUrl({}, { message: 'Referrer URL must be a valid URL' })
    referrerUrl?: string;

    @ApiProperty({
        description: 'Landing page URL',
        example: 'https://app.kogents.com/signup',
        type: String
    })
    @IsOptional()
    @IsUrl({}, { message: 'Landing page must be a valid URL' })
    landingPage?: string;

    @ApiProperty({
        description: 'Campaign ID from advertising platform',
        example: 'camp_123456789',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Campaign ID must be a string' })
    campaignId?: string;

    @ApiProperty({
        description: 'Ad group ID from advertising platform',
        example: 'ag_987654321',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Ad group ID must be a string' })
    adGroupId?: string;

    @ApiProperty({
        description: 'Keyword that triggered the ad',
        example: 'chat application',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Keyword must be a string' })
    keyword?: string;

    @ApiProperty({
        description: 'Google Click ID',
        example: 'gclid_1234567890abcdef',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'GCLID must be a string' })
    gclid?: string;

    @ApiProperty({
        description: 'Facebook Click ID',
        example: 'fbclid_1234567890abcdef',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'FBCLID must be a string' })
    fbclid?: string;

    @ApiProperty({
        description: 'Conversion value (decimal with up to 2 decimal places)',
        example: 50.00,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Conversion value must be a number' })
    @Min(0, { message: 'Conversion value must be non-negative' })
    @Max(99999999.99, { message: 'Conversion value cannot exceed 99,999,999.99' })
    @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
    conversionValue?: number;

    @ApiProperty({
        description: 'Conversion currency code',
        example: 'USD',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Conversion currency must be a string' })
    conversionCurrency?: string;
} 