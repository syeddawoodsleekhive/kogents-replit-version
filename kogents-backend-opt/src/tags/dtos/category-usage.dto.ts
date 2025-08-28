import { ApiProperty } from '@nestjs/swagger';

export class TagCategoryUsageItemDto {
    @ApiProperty() tagId: string;
    @ApiProperty() name: string;
    @ApiProperty() usageCount: number;
}

export class TagCategoryUsageResponseDto {
    @ApiProperty() categoryId: string;
    @ApiProperty() totalUsage: number;
    @ApiProperty({ type: [TagCategoryUsageItemDto] }) items: TagCategoryUsageItemDto[];
}


