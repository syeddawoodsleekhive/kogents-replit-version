import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class UsersResponseDto {
    @ApiProperty({
        description: 'List of users',
        type: [UserResponseDto]
    })
    users: UserResponseDto[];

    @ApiProperty({
        description: 'Current page number',
        example: 1
    })
    page: number;

    @ApiProperty({
        description: 'Number of users per page',
        example: 10
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of users',
        example: 25
    })
    total: number;

    @ApiProperty({
        description: 'Total number of pages',
        example: 3
    })
    totalPages: number;

    @ApiProperty({
        description: 'Whether there is a next page',
        example: true
    })
    hasNext: boolean;

    @ApiProperty({
        description: 'Whether there is a previous page',
        example: false
    })
    hasPrev: boolean;
} 