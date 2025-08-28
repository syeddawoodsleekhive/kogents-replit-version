import { ApiProperty } from '@nestjs/swagger';
import { CannedResponseResponseDto } from './canned-response-response.dto';

export class FindCannedResponsesResponseDto {
    @ApiProperty({ type: [CannedResponseResponseDto] })
    cannedResponses: CannedResponseResponseDto[];

    @ApiProperty() page: number;
    @ApiProperty() limit: number;
    @ApiProperty() total: number;
    @ApiProperty() totalPages: number;
    @ApiProperty() hasNext: boolean;
    @ApiProperty() hasPrev: boolean;
}