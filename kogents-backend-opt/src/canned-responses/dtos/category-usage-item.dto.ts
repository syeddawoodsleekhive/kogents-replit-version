import { ApiProperty } from '@nestjs/swagger';

export class CategoryUsageItemDto {
    @ApiProperty() cannedResponseId: string;
    @ApiProperty() title: string;
    @ApiProperty() usageCount: number;
}


