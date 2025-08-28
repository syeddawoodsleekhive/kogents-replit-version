// src/canned-responses/dtos/canned-response-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CannedResponseCategoryResponseDto } from './canned-response-category-response.dto';
import { CannedResponseFolderResponseDto } from './canned-response-folder-response.dto';

export class CannedResponseResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() workspaceId: string;
    @ApiProperty() title: string;
    @ApiProperty() content: string;
    @ApiPropertyOptional() shortcut?: string | null;
    @ApiPropertyOptional() category?: CannedResponseCategoryResponseDto | null;
    @ApiProperty({ type: [String] }) tags: string[];
    @ApiProperty() isActive: boolean;
    @ApiProperty() isSystem: boolean;
    @ApiPropertyOptional() createdBy?: string | null;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
    @ApiPropertyOptional() cannedResponseFolder?: CannedResponseFolderResponseDto | null;
}