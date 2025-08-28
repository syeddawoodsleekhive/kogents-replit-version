import { ApiProperty } from '@nestjs/swagger';

export class CannedResponseUserPreferenceResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() userId: string;
    @ApiProperty() workspaceId: string;
    @ApiProperty() cannedResponseId: string;
    @ApiProperty() isFavorite: boolean;
    @ApiProperty() usageCount: number;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
}