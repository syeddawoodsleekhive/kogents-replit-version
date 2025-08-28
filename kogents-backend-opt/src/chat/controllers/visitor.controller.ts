import {
    Controller,
    Post,
    Body,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { VisitorService } from '../services/visitor.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
    CreateVisitorSessionDto,
    VisitorSessionResponseDto,
} from '../dtos';

@ApiTags('Visitor Management')
@Controller('visitors')
export class VisitorController {
    constructor(
        private readonly visitorService: VisitorService,
        private readonly logger: AppLoggerService,
    ) { }

    @Public()
    @Post('session')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create visitor session',
        description: 'Creates a new visitor session for tracking and analytics'
    })
    @ApiResponse({
        status: 201,
        description: 'Visitor session created successfully',
        type: VisitorSessionResponseDto
    })
    async createVisitorSession(
        @Body() createSessionDto: CreateVisitorSessionDto
    ): Promise<VisitorSessionResponseDto> {
        try {
            const result = await this.visitorService.createVisitorSession(createSessionDto);
            return result;
        } catch (error) {
            this.logger.error(`Create visitor session error: ${error.message}`, 'VisitorController');
            throw error;
        }
    }
} 