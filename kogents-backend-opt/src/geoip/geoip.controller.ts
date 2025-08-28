import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeoIpService } from './geoip.service';
import { GetGeoIpDto } from './dtos/get-geoip.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('GeoIP')
@Controller('geoip')
export class GeoIpController {
    constructor(
        private readonly service: GeoIpService,
        private readonly logger: AppLoggerService
    ) { }

    @Public()
    @Get('get')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get IP intelligence from MaxMind GeoLite2 databases' })
    async get(@Query() query: GetGeoIpDto, @Req() req: any) {
        const ip = query.ip || (req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim());
        const locales = query.locales && query.locales.length ? query.locales : ['en'];
        const started = Date.now();
        const result = await this.service.getIpIntelligence(ip, { locales });
        this.logger.log(`GeoIP Lookup Result: ${JSON.stringify(result)}`, 'GeoIPController');
        this.logger.logPerformance('GeoIP lookup', Date.now() - started, 'GeoIpController', { ip });
        return result;
    }
}