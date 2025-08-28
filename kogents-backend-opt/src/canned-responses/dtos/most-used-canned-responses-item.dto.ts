import { ApiProperty } from '@nestjs/swagger';
import { CannedResponseResponseDto } from './canned-response-response.dto';

export class MostUsedCannedResponsesItemDto {
    @ApiProperty({ type: CannedResponseResponseDto })
    cannedResponse: CannedResponseResponseDto;

    @ApiProperty()
    usageCount: number;
}


