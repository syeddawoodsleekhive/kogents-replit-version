import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() workspaceId: string;
    @ApiProperty() name: string;
    @ApiProperty() color: string;
    @ApiPropertyOptional() description?: string | null;
    @ApiPropertyOptional() categoryId?: string | null;
    @ApiProperty() createdBy: string;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
}


