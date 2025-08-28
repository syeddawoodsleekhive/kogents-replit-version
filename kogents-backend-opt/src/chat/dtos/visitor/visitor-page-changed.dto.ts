import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class VisitorPageChangedDto {
    @ApiPropertyOptional({ description: 'Page URL' })
    @IsString()
    pageUrl: string;

    @ApiPropertyOptional({ description: 'Page title' })
    @IsString()
    pageTitle: string;

    @ApiPropertyOptional({ description: 'Page path' })
    @IsString()
    pagePath: string;

    @ApiPropertyOptional({ description: 'Page hash' })
    @IsString()
    pageHash: string;

    @ApiPropertyOptional({ description: 'Page query' })
    @IsString()
    pageQuery: string;

    @ApiPropertyOptional({ description: 'Time on page' })
    @IsNumber()
    timeOnPage: number;

    @ApiPropertyOptional({ description: 'Page load time' })
    @IsNumber()
    pageLoadTime: number;

    @ApiPropertyOptional({ description: 'Navigation method' })
    @IsString()
    navigationMethod: string;

    @ApiPropertyOptional({ description: 'Navigation source' })
    @IsString()
    navigationSource: string;

    @ApiPropertyOptional({ description: 'Navigation intent' })
    @IsString()
    navigationIntent: string;

    @ApiPropertyOptional({ description: 'Navigation path' })
    @IsArray()
    navigationPath: {
        push: {
            pageUrl: string;
            pageTitle: string;
            pagePath: string;
            pageHash: string;
            pageQuery: string;
        }[];
    };
}