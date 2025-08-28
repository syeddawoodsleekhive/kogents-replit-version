import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTriggerStatusDto {
    @ApiPropertyOptional({ description: 'Trigger status' })
    @IsBoolean()
    enabled: boolean;

    @ApiPropertyOptional({ description: 'Department ID' })
    @IsOptional()
    @IsString()
    departmentId?: string;
}