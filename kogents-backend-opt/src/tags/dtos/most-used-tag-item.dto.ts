import { ApiProperty } from '@nestjs/swagger';
import { TagResponseDto } from './tag-response.dto';

export class MostUsedTagItemDto {
    @ApiProperty({ type: TagResponseDto })
    tag: TagResponseDto;

    @ApiProperty()
    usageCount: number;
}


