import { ApiProperty } from '@nestjs/swagger';
import { CategoryUsageItemDto } from './category-usage-item.dto';

export class CategoryUsageResponseDto {
    @ApiProperty() categoryId: string;
    @ApiProperty() totalUsage: number;
    @ApiProperty({ type: [CategoryUsageItemDto] }) items: CategoryUsageItemDto[];
}


