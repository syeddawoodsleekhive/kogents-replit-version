import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketingAttributionService } from '../services/marketing-attribution.service';
import {
    CreateAttributionDto,
    UpdateAttributionDto,
    AttributionResponseDto,
    ConversionAnalyticsDto
} from '../dtos/marketing-attributions';

@ApiTags('Analytics - Marketing Attribution')
@Controller('analytics/marketing-attribution')
export class MarketingAttributionController {
    constructor(
        private readonly marketingAttributionService: MarketingAttributionService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create marketing attribution' })
    @ApiResponse({ status: 201, description: 'Attribution created successfully', type: AttributionResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createAttribution(@Body() dto: CreateAttributionDto): Promise<AttributionResponseDto> {
        return this.marketingAttributionService.createAttribution(dto);
    }

    @Get(':attributionId')
    @ApiOperation({ summary: 'Get marketing attribution by ID' })
    @ApiResponse({ status: 200, description: 'Attribution retrieved successfully', type: AttributionResponseDto })
    @ApiResponse({ status: 404, description: 'Attribution not found' })
    async getAttribution(@Param('attributionId') attributionId: string): Promise<AttributionResponseDto> {
        return this.marketingAttributionService.getAttribution(attributionId);
    }

    @Put(':attributionId')
    @ApiOperation({ summary: 'Update marketing attribution' })
    @ApiResponse({ status: 200, description: 'Attribution updated successfully', type: AttributionResponseDto })
    @ApiResponse({ status: 404, description: 'Attribution not found' })
    async updateAttribution(
        @Param('attributionId') attributionId: string,
        @Body() dto: UpdateAttributionDto,
    ): Promise<AttributionResponseDto> {
        return this.marketingAttributionService.updateAttribution(attributionId, dto);
    }

    @Get('session/:sessionToken')
    @ApiOperation({ summary: 'Get attributions by session token' })
    @ApiResponse({ status: 200, description: 'Attributions retrieved successfully', type: [AttributionResponseDto] })
    async getAttributionBySession(@Param('sessionToken') sessionToken: string): Promise<AttributionResponseDto[]> {
        return this.marketingAttributionService.getAttributionBySession(sessionToken);
    }

    @Get('utm/:utmSource/:utmMedium/:utmCampaign')
    @ApiOperation({ summary: 'Get attributions by UTM parameters' })
    @ApiResponse({ status: 200, description: 'Attributions retrieved successfully', type: [AttributionResponseDto] })
    async getAttributionByUtm(
        @Param('utmSource') utmSource: string,
        @Param('utmMedium') utmMedium: string,
        @Param('utmCampaign') utmCampaign: string,
    ): Promise<AttributionResponseDto[]> {
        return this.marketingAttributionService.getAttributionByUtm(utmSource, utmMedium, utmCampaign);
    }

    @Post(':attributionId/conversion')
    @ApiOperation({ summary: 'Track conversion for attribution' })
    @ApiResponse({ status: 200, description: 'Conversion tracked successfully' })
    async trackConversion(
        @Param('attributionId') attributionId: string,
        @Body() conversionData: any,
    ): Promise<void> {
        return this.marketingAttributionService.trackConversion(attributionId, conversionData);
    }

    @Post('analytics')
    @ApiOperation({ summary: 'Get conversion analytics' })
    @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
    async getConversionAnalytics(@Body() dto: ConversionAnalyticsDto): Promise<any> {
        return this.marketingAttributionService.getConversionAnalytics(dto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Bulk create marketing attributions' })
    @ApiResponse({ status: 201, description: 'Attributions created successfully' })
    async bulkCreateAttributions(@Body() attributions: CreateAttributionDto[]): Promise<{ count: number }> {
        const count = await this.marketingAttributionService.bulkCreateAttributions(attributions);
        return { count };
    }
} 