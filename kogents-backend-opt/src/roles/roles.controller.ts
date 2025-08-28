import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import {
    CreateRoleDto,
    UpdateRoleDto,
    UpdateRolePermissionsDto,
    AddRolePermissionDto,
    RemoveRolePermissionDto
} from './dtos';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AuthenticatedRequest } from '../common/types/auth-request.interface';
import {
    ApiValidationError,
    ApiBadRequestError,
    ApiUnauthorizedError,
    ApiForbiddenError,
    ApiNotFoundError,
    ApiConflictError
} from '../common/decorators/api-error-response.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get all roles for a workspace' })
    @ApiResponse({
        status: 200,
        description: 'List of roles retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    isSystem: { type: 'boolean' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    users: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                            },
                        },
                    },
                    _count: {
                        type: 'object',
                        properties: {
                            users: { type: 'number' },
                            rolePermissions: { type: 'number' },
                        },
                    },
                },
            },
        },
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    async findAll(@Request() req: AuthenticatedRequest) {
        return this.rolesService.findAll(req);
    }

    @Post()
    @RequirePermissions({ canCreate: true })
    @ApiOperation({ summary: 'Create a new role' })
    @ApiResponse({
        status: 201,
        description: 'Role created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                isSystem: { type: 'boolean' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                        },
                    },
                },
                _count: {
                    type: 'object',
                    properties: {
                        users: { type: 'number' },
                        rolePermissions: { type: 'number' },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiConflictError()
    async create(@Body() createRoleDto: CreateRoleDto, @Request() req: AuthenticatedRequest) {
        return this.rolesService.create(createRoleDto, req);
    }

    @Get(':id/users')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get users assigned to a role' })
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    status: { type: 'string' },
                },
            },
        },
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    async getRoleUsers(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.rolesService.getRoleUsers(id, req);
    }

    @Get(':id/permissions')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get permissions for a role' })
    @ApiResponse({
        status: 200,
        description: 'Role permissions retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    permission: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                        },
                    },
                },
            },
        },
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    async getRolePermissions(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.rolesService.getRolePermissions(id, req);
    }

    @Put(':id/permissions')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update all permissions for a role' })
    @ApiResponse({
        status: 200,
        description: 'Role permissions updated successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
    })
    @ApiValidationError()
    @ApiBadRequestError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    async updateRolePermissions(@Param('id') id: string, @Body() updateRolePermissionsDto: UpdateRolePermissionsDto, @Request() req: AuthenticatedRequest) {
        return this.rolesService.updateRolePermissions(id, updateRolePermissionsDto, req);
    }

    @Post(':id/permissions')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Add permissions to a role' })
    @ApiResponse({
        status: 201,
        description: 'Permissions added to role successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
    })
    @ApiValidationError()
    @ApiBadRequestError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiConflictError()
    async addRolePermission(@Param('id') id: string, @Body() addRolePermissionDto: AddRolePermissionDto, @Request() req: AuthenticatedRequest) {
        return this.rolesService.addRolePermission(id, addRolePermissionDto, req);
    }

    @Delete(':id/permissions')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Remove a permission from a role' })
    @ApiResponse({
        status: 200,
        description: 'Permission removed from role successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
    })
    @ApiValidationError()
    @ApiBadRequestError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    async removeRolePermission(@Param('id') id: string, @Body() removeRolePermissionDto: RemoveRolePermissionDto, @Request() req: AuthenticatedRequest) {
        return this.rolesService.removeRolePermission(id, removeRolePermissionDto, req);
    }

    @Get(':id')
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'Get a role by ID' })
    @ApiResponse({
        status: 200,
        description: 'Role retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                isSystem: { type: 'boolean' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                        },
                    },
                },
                rolePermissions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            permission: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                _count: {
                    type: 'object',
                    properties: {
                        users: { type: 'number' },
                        rolePermissions: { type: 'number' },
                    },
                },
            },
        },
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.rolesService.findOne(id, req);
    }

    @Put(':id')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update a role' })
    @ApiResponse({
        status: 200,
        description: 'Role updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                isSystem: { type: 'boolean' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                        },
                    },
                },
                _count: {
                    type: 'object',
                    properties: {
                        users: { type: 'number' },
                        rolePermissions: { type: 'number' },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiConflictError()
    async update(
        @Param('id') id: string,
        @Body() updateRoleDto: UpdateRoleDto,
        @Request() req: AuthenticatedRequest
    ) {
        return this.rolesService.update(id, updateRoleDto, req);
    }

    @Delete(':id')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({ summary: 'Delete a role' })
    @ApiResponse({
        status: 200,
        description: 'Role deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
    })
    @ApiBadRequestError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.rolesService.remove(id, req);
    }
} 