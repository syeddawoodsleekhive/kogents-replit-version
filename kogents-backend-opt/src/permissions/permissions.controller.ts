import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import {
    CreatePermissionDto,
    UpdatePermissionDto,
    PermissionResponseDto,
    PermissionsResponseDto,
    CategoriesResponseDto
} from './dtos';
import {
    ApiValidationError,
    ApiBadRequestError,
    ApiUnauthorizedError,
    ApiForbiddenError,
    ApiNotFoundError,
    ApiConflictError
} from '../common/decorators/api-error-response.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Get()
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get all permissions' })
    @ApiResponse({
        status: 200,
        description: 'Permissions retrieved successfully',
        type: PermissionsResponseDto,
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    async findAll(): Promise<PermissionsResponseDto> {
        return this.permissionsService.findAll();
    }

    @Get('categories')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get all permission categories' })
    @ApiResponse({
        status: 200,
        description: 'Permission categories retrieved successfully',
        type: CategoriesResponseDto,
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    async getCategories(): Promise<CategoriesResponseDto> {
        return this.permissionsService.getCategories();
    }

    @Get(':id')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get a permission by ID' })
    @ApiParam({
        name: 'id',
        description: 'Permission ID',
        example: 'clx1234567890abcdef'
    })
    @ApiResponse({
        status: 200,
        description: 'Permission retrieved successfully',
        type: PermissionResponseDto,
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    async findOne(@Param('id') id: string): Promise<PermissionResponseDto> {
        return this.permissionsService.findOne(id);
    }

    @Post()
    @RequirePermissions({ canCreate: true })
    @ApiOperation({ summary: 'Create a new permission' })
    @ApiResponse({
        status: 201,
        description: 'Permission created successfully',
        type: PermissionResponseDto,
    })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiConflictError()
    async create(@Body() createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
        return this.permissionsService.create(createPermissionDto);
    }

    @Put(':id')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update a permission' })
    @ApiParam({
        name: 'id',
        description: 'Permission ID',
        example: 'clx1234567890abcdef'
    })
    @ApiResponse({
        status: 200,
        description: 'Permission updated successfully',
        type: PermissionResponseDto,
    })
    @ApiValidationError()
    @ApiBadRequestError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiConflictError()
    async update(
        @Param('id') id: string,
        @Body() updatePermissionDto: UpdatePermissionDto,
    ): Promise<PermissionResponseDto> {
        return this.permissionsService.update(id, updatePermissionDto);
    }

    @Delete(':id')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({ summary: 'Delete a permission' })
    @ApiParam({
        name: 'id',
        description: 'Permission ID',
        example: 'clx1234567890abcdef'
    })
    @ApiResponse({
        status: 200,
        description: 'Permission deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Permission has been deleted successfully' },
            },
        },
    })
    @ApiBadRequestError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiConflictError()
    async remove(@Param('id') id: string): Promise<{ message: string }> {
        return this.permissionsService.remove(id);
    }
}