import {
    Controller,
    Post,
    Body,
    Param,
    Request,
    UseGuards,
    HttpStatus,
    HttpCode,
    ForbiddenException,
    Get,
    Query,
    Put,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiParam,
    ApiOkResponse,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import {
    ApiValidationError,
    ApiForbiddenError,
    ApiConflictError,
    ApiInternalServerError,
} from '../common/decorators/api-error-response.decorator';
import { AuthenticatedRequest } from '../common/types/auth-request.interface';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { CannedResponsesService } from './canned-responses.service';
import { CreateCannedResponseDto } from './dtos/create-canned-response.dto';
import { CannedResponseResponseDto } from './dtos/canned-response-response.dto';
import { FindCannedResponsesDto } from './dtos/find-canned-responses.dto';
import { FindCannedResponsesResponseDto } from './dtos/find-canned-responses-response.dto';
import { UpdateCannedResponseDto } from './dtos/update-canned-response.dto';
import { Delete } from '@nestjs/common';
import { ExportCannedResponseDto } from './dtos/export-canned-response.dto';
import { ImportCannedResponsesDto } from './dtos/import-canned-responses.dto';
import { CannedResponseUserPreferenceResponseDto } from './dtos/canned-response-user-preference-response.dto';
import { MostUsedCannedResponsesItemDto } from './dtos/most-used-canned-responses-item.dto';
import { CreateCannedResponseCategoryDto } from './dtos/create-canned-response-category.dto';
import { UpdateCannedResponseCategoryDto } from './dtos/update-canned-response-category.dto';
import { CannedResponseCategoryResponseDto } from './dtos/canned-response-category-response.dto';
import { CategoryUsageResponseDto } from './dtos/category-usage-response.dto';
import { CreateCannedResponseFolderDto } from './dtos/create-canned-response-folder.dto';
import { UpdateCannedResponseFolderDto } from './dtos/update-canned-response-folder.dto';
import { CannedResponseFolderResponseDto } from './dtos/canned-response-folder-response.dto';

@ApiTags('Canned Responses')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('canned-responses')
export class CannedResponsesController {
    constructor(
        private readonly logger: AppLoggerService,
        private readonly cannedResponsesService: CannedResponsesService,
    ) { }

    @Post('create')
    @RequirePermissions({ canCreate: true })
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create a canned response',
        description: 'Creates a canned response within the specified workspace',
    })
    @ApiBody({
        type: CreateCannedResponseDto,
        description: 'Canned response creation data',
    })
    @ApiCreatedResponse({
        description: 'Canned response created successfully',
        type: CannedResponseResponseDto,
    })
    @ApiValidationError()
    @ApiConflictError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async create(
        @Body() dto: CreateCannedResponseDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseResponseDto> {

        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Creating canned response in workspace: ${req.user.workspaceId}`, 'CannedResponsesController');

        return this.cannedResponsesService.createCannedResponse(req.user.workspaceId, req.user.userId, dto);
    }

    @Get('find')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Find canned responses',
        description: 'Find canned responses by optional category and/or search term',
    })
    @ApiQuery({ name: 'category', required: false, description: 'Category ID to filter by' })
    @ApiQuery({ name: 'search', required: false, description: 'Search term for title/content/tags' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    @ApiOkResponse({
        description: 'Canned responses retrieved successfully',
        schema: {
            type: 'array',
            items: { $ref: '#/components/schemas/CannedResponseResponseDto' }
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async find(
        @Query() query: FindCannedResponsesDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<FindCannedResponsesResponseDto> {

        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(
            `Finding canned responses in workspace ${req.user.workspaceId} with query ${JSON.stringify(query)}`,
            'CannedResponsesController',
        );

        return this.cannedResponsesService.findCannedResponses(req.user.workspaceId, query);
    }

    @Post('export')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Export canned responses',
        description: 'Exports all canned responses in the workspace as a list of JSON objects without sensitive identifiers',
    })
    @ApiOkResponse({
        description: 'Canned responses exported successfully',
        schema: {
            type: 'array',
            items: { $ref: '#/components/schemas/ExportCannedResponseDto' }
        },
    })
    @ApiForbiddenError()
    @ApiInternalServerError()
    async export(
        @Request() req: AuthenticatedRequest,
    ): Promise<ExportCannedResponseDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Exporting canned responses for workspace: ${req.user.workspaceId}`, 'CannedResponsesController');

        return this.cannedResponsesService.exportCannedResponses(req.user.workspaceId);
    }

    @Post('categories')
    @RequirePermissions({ canCreate: true })
    @ApiOperation({ summary: 'Create a canned response category' })
    @ApiBody({ type: CreateCannedResponseCategoryDto })
    @ApiCreatedResponse({ description: 'Category created', type: CannedResponseCategoryResponseDto })
    async createCategory(
        @Body() dto: CreateCannedResponseCategoryDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseCategoryResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Creating category in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.createCategory(req.user.workspaceId, req.user.userId, dto);
    }

    @Get('categories')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'List canned response categories' })
    @ApiOkResponse({ description: 'Categories retrieved', schema: { type: 'array', items: { $ref: '#/components/schemas/CannedResponseCategoryResponseDto' } } })
    async getCategories(
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseCategoryResponseDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Listing categories in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.getCategories(req.user.workspaceId);
    }

    @Post('folders')
    @RequirePermissions({ canCreate: true })
    @ApiOperation({ summary: 'Create a canned response folder' })
    @ApiBody({ type: CreateCannedResponseFolderDto })
    @ApiCreatedResponse({ description: 'Folder created', type: CannedResponseFolderResponseDto })
    async createFolder(
        @Body() dto: CreateCannedResponseFolderDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseFolderResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Creating folder in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.createFolder(req.user.workspaceId, req.user.userId, dto);
    }

    @Get('folders')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'List canned response folders' })
    @ApiOkResponse({ description: 'Folders retrieved', schema: { type: 'array', items: { $ref: '#/components/schemas/CannedResponseFolderResponseDto' } } })
    async getFolders(
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseFolderResponseDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Listing folders in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.getFolders(req.user.workspaceId);
    }

    @Post('import')
    @RequirePermissions({ canCreate: true })
    @ApiOperation({
        summary: 'Import canned responses',
        description: 'Imports canned responses from a provided list of JSON objects as exported previously',
    })
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiBody({
        type: ImportCannedResponsesDto,
        description: 'List of canned responses to import',
    })
    @ApiOkResponse({
        description: 'Canned responses import job queued',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Canned responses import initiated' },
                jobId: { type: 'string', example: 'job_123456789' }
            }
        }
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async import(
        @Body() dto: ImportCannedResponsesDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<{ success: boolean; message: string; jobId: string }> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Importing ${dto.items?.length ?? 0} canned responses into workspace: ${req.user.workspaceId}`, 'CannedResponsesController');

        return this.cannedResponsesService.importCannedResponses(req.user.workspaceId, req.user.userId, dto);
    }

    @Put('categories/:categoryId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update a category' })
    @ApiParam({ name: 'categoryId', description: 'Category ID' })
    @ApiBody({ type: UpdateCannedResponseCategoryDto })
    @ApiOkResponse({ description: 'Category updated', type: CannedResponseCategoryResponseDto })
    async updateCategory(
        @Param('categoryId') categoryId: string,
        @Body() dto: UpdateCannedResponseCategoryDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseCategoryResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Updating category ${categoryId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.updateCategory(req.user.workspaceId, categoryId, dto);
    }

    @Delete('categories/:categoryId')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({ summary: 'Delete a category' })
    @ApiParam({ name: 'categoryId', description: 'Category ID' })
    @ApiOkResponse({ description: 'Category deleted', schema: { type: 'object', properties: { success: { type: 'boolean' } } } })
    async deleteCategory(
        @Param('categoryId') categoryId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<{ success: boolean }> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Deleting category ${categoryId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.deleteCategory(req.user.workspaceId, categoryId);
    }

    @Get('categories/:categoryId/responses')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get responses in a category' })
    @ApiParam({ name: 'categoryId', description: 'Category ID' })
    @ApiOkResponse({ description: 'Responses retrieved', schema: { type: 'array', items: { $ref: '#/components/schemas/CannedResponseResponseDto' } } })
    async getCategoryResponses(
        @Param('categoryId') categoryId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseResponseDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Listing responses for category ${categoryId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.getCategoryResponses(req.user.workspaceId, categoryId);
    }

    @Get('categories/:categoryId/usage')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get category usage' })
    @ApiParam({ name: 'categoryId', description: 'Category ID' })
    @ApiOkResponse({ description: 'Usage retrieved', type: CategoryUsageResponseDto })
    async getCategoryUsage(
        @Param('categoryId') categoryId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<CategoryUsageResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Getting usage for category ${categoryId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.getCategoryUsage(req.user.workspaceId, categoryId);
    }

    @Put('folders/:folderId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update a folder' })
    @ApiParam({ name: 'folderId', description: 'Folder ID' })
    @ApiBody({ type: UpdateCannedResponseFolderDto })
    @ApiOkResponse({ description: 'Folder updated', type: CannedResponseFolderResponseDto })
    async updateFolder(
        @Param('folderId') folderId: string,
        @Body() dto: UpdateCannedResponseFolderDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseFolderResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Updating folder ${folderId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.updateFolder(req.user.workspaceId, folderId, dto);
    }

    @Delete('folders/:folderId')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({ summary: 'Delete a folder' })
    @ApiParam({ name: 'folderId', description: 'Folder ID' })
    @ApiOkResponse({ description: 'Folder deleted', schema: { type: 'object', properties: { success: { type: 'boolean' } } } })
    async deleteFolder(
        @Param('folderId') folderId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<{ success: boolean }> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        this.logger.log(`Deleting folder ${folderId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.deleteFolder(req.user.workspaceId, folderId);
    }

    @Post(':userId/favorites/:responseId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Mark a canned response as favorite for a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiParam({ name: 'responseId', description: 'Canned response ID' })
    @ApiOkResponse({ description: 'Marked as favorite', type: CannedResponseUserPreferenceResponseDto })
    async markFavorite(
        @Param('userId') userId: string,
        @Param('responseId') responseId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseUserPreferenceResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Mark favorite response ${responseId} for user ${userId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.markFavorite(req.user.workspaceId, userId, responseId);
    }

    @Delete(':userId/favorites/:responseId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Unmark a canned response as favorite for a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiParam({ name: 'responseId', description: 'Canned response ID' })
    @ApiOkResponse({ description: 'Unmarked as favorite', schema: { type: 'object', properties: { success: { type: 'boolean' } } } })
    async unmarkFavorite(
        @Param('userId') userId: string,
        @Param('responseId') responseId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<{ success: boolean }> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Unmark favorite response ${responseId} for user ${userId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.unmarkFavorite(req.user.workspaceId, userId, responseId);
    }

    @Get(':userId/favorites')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get user favorite canned responses' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiOkResponse({ description: 'Favorites fetched', schema: { type: 'array', items: { $ref: '#/components/schemas/CannedResponseResponseDto' } } })
    async getFavorites(
        @Param('userId') userId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseResponseDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Get favorites for user ${userId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.getFavorites(req.user.workspaceId, userId);
    }

    @Get(':userId/most_used')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get user most used canned responses' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiOkResponse({ description: 'Most used fetched', schema: { type: 'array', items: { $ref: '#/components/schemas/MostUsedCannedResponsesItemDto' } } })
    async getMostUsed(
        @Param('userId') userId: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<MostUsedCannedResponsesItemDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Get most used for user ${userId} in workspace ${req.user.workspaceId}`, 'CannedResponsesController');
        return this.cannedResponsesService.getMostUsed(req.user.workspaceId, userId) as unknown as MostUsedCannedResponsesItemDto[];
    }

    @Put(':id')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Update a canned response',
        description: 'Updates canned response details within the authenticated workspace',
    })
    @ApiParam({
        name: 'id',
        description: 'Canned response ID',
        example: 'clx1234567890abcdef',
    })
    @ApiBody({
        type: UpdateCannedResponseDto,
        description: 'Canned response update data',
    })
    @ApiOkResponse({
        description: 'Canned response updated successfully',
        type: CannedResponseResponseDto,
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCannedResponseDto,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Updating canned response ${id} in workspace: ${req.user.workspaceId}`, 'CannedResponsesController');

        return this.cannedResponsesService.updateCannedResponse(
            req.user.workspaceId,
            id,
            req.user.userId,
            dto,
        );
    }

    @Delete(':id')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({
        summary: 'Delete a canned response',
        description: 'Deletes a canned response by ID within the authenticated workspace',
    })
    @ApiParam({
        name: 'id',
        description: 'Canned response ID',
        example: 'clx1234567890abcdef',
    })
    @ApiOkResponse({
        description: 'Canned response deleted successfully',
        type: CannedResponseResponseDto,
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async delete(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
    ): Promise<CannedResponseResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }

        this.logger.log(`Deleting canned response ${id} in workspace: ${req.user.workspaceId}`, 'CannedResponsesController');

        return this.cannedResponsesService.deleteCannedResponse(req.user.workspaceId, id);
    }
}