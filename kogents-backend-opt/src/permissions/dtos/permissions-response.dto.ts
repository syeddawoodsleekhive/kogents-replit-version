import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission-response.dto';

export class PermissionsResponseDto {
    @ApiProperty({
        description: 'Array of permissions',
        type: [PermissionResponseDto]
    })
    permissions: PermissionResponseDto[];

    @ApiProperty({
        description: 'Total number of permissions',
        example: 50
    })
    total: number;
} 