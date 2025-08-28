import { ApiProperty } from '@nestjs/swagger';

export class CategoriesResponseDto {
    @ApiProperty({
        description: 'Array of permission categories',
        example: ['user-management', 'role-management', 'workspace-management']
    })
    categories: string[];

    @ApiProperty({
        description: 'Total number of categories',
        example: 5
    })
    total: number;
} 