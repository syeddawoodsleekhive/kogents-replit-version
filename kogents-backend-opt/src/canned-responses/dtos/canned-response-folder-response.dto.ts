import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CannedResponseFolderResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() workspaceId: string;
    @ApiProperty() name: string;
    @ApiPropertyOptional() parentId?: string | null;
    @ApiProperty() sortOrder: number;
    @ApiProperty() createdBy: string;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
}


