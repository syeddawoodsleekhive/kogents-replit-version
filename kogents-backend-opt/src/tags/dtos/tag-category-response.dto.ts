import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagCategoryResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() workspaceId: string;
    @ApiProperty() name: string;
    @ApiProperty() color: string;
    @ApiPropertyOptional() description?: string | null;
    @ApiProperty() sortOrder: number;
    @ApiProperty() createdBy: string;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
}


