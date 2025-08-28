import {
    Controller,
    Get,
    Request,
    HttpCode,
    HttpStatus,
    UseGuards,
    ForbiddenException,
    Param,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../../common/types/auth-request.interface';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { ChatService } from '../services/chat.service';
import { GetChatHistoryDto } from '../dtos/chat/get-chat-history.dto';
import { SearchChatHistoryDto } from '../dtos/chat/search-chat-history.dto';

@ApiTags('Chat Management')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('chat')
export class ChatController {
    constructor(
        private readonly logger: AppLoggerService,
        private readonly chatService: ChatService,
    ) { }

    @Get('history')
    @RequirePermissions({ canRead: true })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get chat history',
        description: 'Returns chat history filtered by workspace.',
    })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    async getChatHistory(
        @Request() req: AuthenticatedRequest,
        @Query() query: GetChatHistoryDto,
    ) {

        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized. Invalid JWT token. Please login again.');
        }

        try {
            this.logger.log(
                `Fetching chat history ws=${req.user.workspaceId}`,
                'ChatController',
            );

            // Delegates to service; service implementation pending
            const result = await this.chatService.getChatHistory(req.user.workspaceId, undefined, query.page, query.limit);

            return result;
        } catch (error) {
            this.logger.error(`Get chat history error: ${error.message}`, 'ChatController');
            throw error;
        }
    }

    @Get('history/search')
    @RequirePermissions({ canRead: true })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search chat history',
        description: 'Returns chat history filtered by workspace.',
    })
    @ApiQuery({ name: 'query', required: true, description: 'Search query' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    async searchChatHistory(
        @Query() query: SearchChatHistoryDto,
        @Request() req: AuthenticatedRequest,
    ) {

        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized. Invalid JWT token. Please login again.');
        }

        try {
            const result = await this.chatService.getChatHistory(req.user.workspaceId, undefined, query.page, query.limit, query.query);

            return result;
        } catch (error) {
            this.logger.error(`Search chat history error: ${error.message}`, 'ChatController');
            throw error;
        }
    }

    @Get('history/department/:departmentId')
    @RequirePermissions({ canRead: true })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get chat history',
        description: 'Returns chat history filtered by workspace and department.',
    })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    async getChatHistoryForDepartment(
        @Param('departmentId') departmentId: string,
        @Query() query: GetChatHistoryDto,
        @Request() req: AuthenticatedRequest,
    ) {

        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized. Invalid JWT token. Please login again.');
        }

        try {
            this.logger.log(
                `Fetching chat history ws=${req.user.workspaceId}`,
                'ChatController',
            );

            // Delegates to service; service implementation pending
            const result = await this.chatService.getChatHistory(req.user.workspaceId, departmentId, query.page, query.limit);

            return result;
        } catch (error) {
            this.logger.error(`Get chat history error: ${error.message}`, 'ChatController');
            throw error;
        }
    }

    @Get('history/room/:roomId')
    @RequirePermissions({ canRead: true })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get chat history',
        description: 'Returns chat history filtered by workspace and room.',
    })
    @ApiParam({ name: 'roomId', required: true, description: 'Room ID' })
    async getChatHistoryForRoom(
        @Param('roomId') roomId: string,
        @Request() req: AuthenticatedRequest,
    ) {

        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized. Invalid JWT token. Please login again.');
        }

        try {
            this.logger.log(
                `Fetching chat history ws=${req.user.workspaceId} and room=${roomId}`,
                'ChatController',
            );

            const result = await this.chatService.getRoomById(roomId, req.user.workspaceId);

            return result;

        } catch (error) {
            this.logger.error(`Get chat history error: ${error.message}`, 'ChatController');
            throw error;
        }
    }
}