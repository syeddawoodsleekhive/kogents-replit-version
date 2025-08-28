import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiValidationError, ApiForbiddenError, ApiConflictError, ApiInternalServerError, ApiUnauthorizedError, ApiNotFoundError } from '../common/decorators/api-error-response.decorator';
import { FindTagsDto } from './dtos/find-tags.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../common/types/auth-request.interface';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dtos/create-tag.dto';
import { UpdateTagDto } from './dtos/update-tag.dto';
import { TagResponseDto } from './dtos/tag-response.dto';
import { CreateTagCategoryDto } from './dtos/create-tag-category.dto';
import { UpdateTagCategoryDto } from './dtos/update-tag-category.dto';
import { TagCategoryResponseDto } from './dtos/tag-category-response.dto';
import { MostUsedTagItemDto } from './dtos/most-used-tag-item.dto';
import { TagCategoryUsageResponseDto } from './dtos/category-usage.dto';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('tags')
export class TagsController {
    constructor(
        private readonly tagsService: TagsService,
    ) { }

    // Non-parameterized endpoints first
    @Post()
    @RequirePermissions({ canCreate: true })
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a tag' })
    @ApiBody({ type: CreateTagDto })
    @ApiCreatedResponse({ description: 'Tag created', type: TagResponseDto })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiConflictError()
    @ApiInternalServerError()
    async createTag(@Body() dto: CreateTagDto, @Request() req: AuthenticatedRequest): Promise<TagResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.createTag(req.user.workspaceId, dto, req.user.userId) as unknown as TagResponseDto;
    }

    @Get()
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Find tags' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by name/description' })
    @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    @ApiOkResponse({ description: 'Tags retrieved' })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async findTags(@Query() query: FindTagsDto, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.findTags(req.user.workspaceId, query);
    }

    // Tag Categories - non-parameterized
    @Post('categories')
    @RequirePermissions({ canCreate: true })
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a tag category' })
    @ApiBody({ type: CreateTagCategoryDto })
    @ApiCreatedResponse({ description: 'Tag category created', type: TagCategoryResponseDto })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiConflictError()
    @ApiInternalServerError()
    async createTagCategory(@Body() dto: CreateTagCategoryDto, @Request() req: AuthenticatedRequest): Promise<TagCategoryResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.createTagCategory(req.user.workspaceId, req.user.userId, dto) as unknown as TagCategoryResponseDto;
    }

    @Get('categories')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'List tag categories' })
    @ApiOkResponse({ description: 'Tag categories retrieved', schema: { type: 'array', items: { $ref: '#/components/schemas/TagCategoryResponseDto' } } })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async getTagCategories(@Request() req: AuthenticatedRequest): Promise<TagCategoryResponseDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.getTagCategories(req.user.workspaceId) as unknown as TagCategoryResponseDto[];
    }

    // Favorites & Most used - non-parameterized resource with params in path start; keep in non-parameterized block as resource starts with fixed segment
    @Post(':userId/favorites/:tagId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Mark tag as favorite for a user' })
    @ApiParam({ name: 'userId' })
    @ApiParam({ name: 'tagId' })
    @ApiOkResponse({ description: 'Marked favorite' })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async markFavoriteTag(@Param('userId') userId: string, @Param('tagId') tagId: string, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.markFavoriteTag(req.user.workspaceId, userId, tagId);
    }

    @Delete(':userId/favorites/:tagId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Unmark tag as favorite for a user' })
    @ApiParam({ name: 'userId' })
    @ApiParam({ name: 'tagId' })
    @ApiOkResponse({ description: 'Unmarked favorite' })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async unmarkFavoriteTag(@Param('userId') userId: string, @Param('tagId') tagId: string, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.unmarkFavoriteTag(req.user.workspaceId, userId, tagId);
    }

    @Get(':userId/favorites')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get user favorite tags' })
    @ApiParam({ name: 'userId' })
    @ApiOkResponse({ description: 'Favorites retrieved', schema: { type: 'array', items: { $ref: '#/components/schemas/TagResponseDto' } } })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async getFavoriteTags(@Param('userId') userId: string, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.getFavoriteTags(req.user.workspaceId, userId);
    }

    @Get(':userId/most_used')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get user most used tags' })
    @ApiParam({ name: 'userId' })
    @ApiOkResponse({ description: 'Most used retrieved', schema: { type: 'array', items: { $ref: '#/components/schemas/MostUsedTagItemDto' } } })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async getMostUsedTags(@Param('userId') userId: string, @Request() req: AuthenticatedRequest): Promise<MostUsedTagItemDto[]> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.getMostUsedTags(req.user.workspaceId, userId) as unknown as MostUsedTagItemDto[];
    }

    @Get('categories/:categoryId/tags')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get tags in a category' })
    @ApiParam({ name: 'categoryId' })
    @ApiOkResponse({ description: 'Tags retrieved', schema: { type: 'array', items: { $ref: '#/components/schemas/TagResponseDto' } } })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async getCategoryTags(@Param('categoryId') categoryId: string, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.getCategoryTags(req.user.workspaceId, categoryId);
    }

    @Get('categories/:categoryId/usage')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get tag category usage' })
    @ApiParam({ name: 'categoryId' })
    @ApiOkResponse({ description: 'Usage retrieved', type: TagCategoryUsageResponseDto })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async getTagCategoryUsage(@Param('categoryId') categoryId: string, @Request() req: AuthenticatedRequest): Promise<TagCategoryUsageResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.getCategoryUsage(req.user.workspaceId, categoryId) as unknown as TagCategoryUsageResponseDto;
    }

    // Parameterized endpoints at the end
    @Put(':tagId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update a tag' })
    @ApiParam({ name: 'tagId' })
    @ApiBody({ type: UpdateTagDto })
    @ApiOkResponse({ description: 'Tag updated', type: TagResponseDto })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiConflictError()
    @ApiInternalServerError()
    async updateTag(@Param('tagId') tagId: string, @Body() dto: UpdateTagDto, @Request() req: AuthenticatedRequest): Promise<TagResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.updateTag(req.user.workspaceId, tagId, dto) as unknown as TagResponseDto;
    }

    @Delete(':tagId')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({ summary: 'Delete a tag' })
    @ApiParam({ name: 'tagId' })
    @ApiOkResponse({ description: 'Tag deleted' })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async deleteTag(@Param('tagId') tagId: string, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.deleteTag(req.user.workspaceId, tagId);
    }

    @Put('categories/:categoryId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update a tag category' })
    @ApiParam({ name: 'categoryId' })
    @ApiBody({ type: UpdateTagCategoryDto })
    @ApiOkResponse({ description: 'Tag category updated', type: TagCategoryResponseDto })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiConflictError()
    @ApiInternalServerError()
    async updateTagCategory(@Param('categoryId') categoryId: string, @Body() dto: UpdateTagCategoryDto, @Request() req: AuthenticatedRequest): Promise<TagCategoryResponseDto> {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.updateTagCategory(req.user.workspaceId, categoryId, dto) as unknown as TagCategoryResponseDto;
    }

    @Delete('categories/:categoryId')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({ summary: 'Delete a tag category' })
    @ApiParam({ name: 'categoryId' })
    @ApiOkResponse({ description: 'Tag category deleted' })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async deleteTagCategory(@Param('categoryId') categoryId: string, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.tagsService.deleteTagCategory(req.user.workspaceId, categoryId);
    }
}


