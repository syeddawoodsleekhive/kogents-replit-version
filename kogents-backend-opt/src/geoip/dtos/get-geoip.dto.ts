import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIP, IsOptional, IsString } from 'class-validator';

export class GetGeoIpDto {
    @ApiPropertyOptional({ description: 'Target IP address. If omitted, server uses request IP.' })
    @IsOptional()
    @IsIP()
    ip?: string;

    @ApiPropertyOptional({ description: 'Preferred locales for names', type: [String], example: ['en'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    locales?: string[];

    @ApiPropertyOptional({ description: 'Include database metadata (not implemented yet)', default: false })
    @IsOptional()
    @IsBoolean()
    withDbMeta?: boolean;
}


