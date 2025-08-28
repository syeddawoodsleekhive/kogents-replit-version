import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CannedResponseCategoryResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() workspaceId: string;
    @ApiProperty() name: string;
    @ApiProperty() color: string;
    @ApiPropertyOptional() description?: string | null;
    @ApiProperty() sortOrder: number;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
}


