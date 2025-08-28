import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExportCannedResponseDto } from './export-canned-response.dto';

export class ImportCannedResponsesDto {
    @ApiProperty({ type: [ExportCannedResponseDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ExportCannedResponseDto)
    items: ExportCannedResponseDto[];
}


