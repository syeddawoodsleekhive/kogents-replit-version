import { IsNotEmpty, IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddRolePermissionDto {
    @ApiProperty({
        description: 'Array of permission IDs to add to the role',
        example: ['perm1234567890abcdef', 'perm0987654321fedcba'],
        type: [String]
    })
    @IsNotEmpty({ message: 'Permission IDs are required' })
    @IsArray({ message: 'Permission IDs must be an array' })
    @ArrayMinSize(1, { message: 'At least one permission ID is required' })
    @IsString({ each: true, message: 'Each permission ID must be a string' })
    permissionIds: string[];
} 