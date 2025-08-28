import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadPolicyResponseDto {
    @ApiProperty({ type: [String] })
    allowedMimeExact: string[];

    @ApiProperty({ type: [String] })
    allowedMimePrefixes: string[];

    @ApiPropertyOptional({ type: [String] })
    denyExact?: string[];

    @ApiProperty()
    defaultChunkSize: number;

    @ApiProperty()
    directMaxSize: number;

    @ApiPropertyOptional({ description: 'Per-type max size in bytes' })
    perTypeMax?: Record<string, number>;

    @ApiPropertyOptional()
    enableArchives?: boolean;
}