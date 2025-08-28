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
    HttpStatus,
    HttpCode,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
    CreateUserDto,
    UpdateUserDto,
    UpdateProfileDto,
    GetUsersDto,
    UsersResponseDto,
    GetUserRolesDto,
    AssignRoleToUserDto,
    RemoveRoleFromUserDto,
    GetUserPermissionsDto
} from './dtos';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import {
    ApiValidationError,
    ApiBadRequestError,
    ApiUnauthorizedError,
    ApiForbiddenError,
    ApiNotFoundError,
    ApiConflictError,
    ApiInternalServerError
} from '../common/decorators/api-error-response.decorator';
import { AuthenticatedRequest } from '../common/types/auth-request.interface';
import { AppLoggerService } from '../common/logger/app-logger.service';

@ApiTags('Users Management')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly logger: AppLoggerService,
    ) { }

    @Post()
    @RequirePermissions({ canCreate: true })
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create a new user',
        description: 'Create a new user in the current workspace'
    })
    @ApiBody({
        type: CreateUserDto,
        description: 'User creation data'
    })
    @ApiCreatedResponse({
        description: 'User created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                status: { type: 'string' },
                workspaceId: { type: 'string' },
                roleId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiValidationError()
    @ApiConflictError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async create(@Body() createUserDto: CreateUserDto, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Creating user: ${createUserDto.email}`, 'UsersController');
        return this.usersService.createUser(createUserDto, req);
    }

    @Get()
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get all users',
        description: 'Retrieve all users for the current workspace with pagination, search, and filtering'
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number for pagination',
        example: 1
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of users per page',
        example: 10
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Search term for name or email',
        example: 'john'
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: ['active', 'inactive', 'pending', 'suspended'],
        description: 'Filter by user status'
    })
    @ApiQuery({
        name: 'role',
        required: false,
        type: String,
        description: 'Filter by role name',
        example: 'Developer'
    })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['name', 'email', 'status', 'createdAt'],
        description: 'Sort field',
        example: 'name'
    })
    @ApiQuery({
        name: 'sortOrder',
        required: false,
        enum: ['asc', 'desc'],
        description: 'Sort order',
        example: 'asc'
    })
    @ApiOkResponse({
        description: 'Users retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            phone: { type: 'string' },
                            status: { type: 'string' },
                            avatarUrl: { type: 'string' },
                            workspaceId: { type: 'string' },
                            role: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    isSystem: { type: 'boolean' },
                                    isActive: { type: 'boolean' },
                                },
                            },
                            permissions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        category: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
            },
        },
    })
    @ApiForbiddenError()
    @ApiInternalServerError()
    async findAll(@Query() query: GetUsersDto, @Request() req: AuthenticatedRequest): Promise<UsersResponseDto> {
        this.logger.log(`Retrieving users with filters: ${JSON.stringify(query)}`, 'UsersController');
        return this.usersService.getAllUsers(query, req);
    }

    @Get('profile')
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Retrieve the current authenticated user\'s profile information including role and permissions'
    })
    @ApiOkResponse({
        description: 'Current user profile retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                status: { type: 'string' },
                avatarUrl: { type: 'string' },
                workspaceId: { type: 'string' },
                role: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        isSystem: { type: 'boolean' },
                        isActive: { type: 'boolean' },
                    },
                },
                permissions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' },
                        },
                    },
                },
            },
        },
    })
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async getProfile(@Request() req: AuthenticatedRequest) {
        this.logger.log(`Getting current user profile`, 'UsersController');
        return this.usersService.getCurrentUserProfile(req);
    }

    @Put('profile')
    @ApiOperation({
        summary: 'Update current user profile',
        description: 'Update the current authenticated user\'s profile information (name, email, phone, avatar, password)'
    })
    @ApiBody({
        type: UpdateProfileDto,
        description: 'Profile update data'
    })
    @ApiOkResponse({
        description: 'Profile updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                status: { type: 'string' },
                avatarUrl: { type: 'string' },
                workspaceId: { type: 'string' },
                role: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        isSystem: { type: 'boolean' },
                        isActive: { type: 'boolean' },
                    },
                },
                permissions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' },
                        },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiConflictError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Updating current user profile`, 'UsersController');
        return this.usersService.updateProfile(updateProfileDto, req);
    }

    @Put(':id/activate')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Activate a user',
        description: 'Activate a deactivated user in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'User activated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                status: { type: 'string' },
                workspaceId: { type: 'string' },
                roleId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiNotFoundError()
    @ApiBadRequestError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async activate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Activating user: ${id}`, 'UsersController');
        return this.usersService.activateUser(id, req);
    }

    @Put(':id/deactivate')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Deactivate a user',
        description: 'Deactivate an active user in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'User deactivated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                status: { type: 'string' },
                workspaceId: { type: 'string' },
                roleId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiNotFoundError()
    @ApiBadRequestError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async deactivate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Deactivating user: ${id}`, 'UsersController');
        return this.usersService.deactivateUser(id, req);
    }

    @Get(':id/roles')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get roles for a user',
        description: 'Retrieve the role assigned to a specific user'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'User roles retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                    },
                },
                role: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        isSystem: { type: 'boolean' },
                        isActive: { type: 'boolean' },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    category: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
    })
    @ApiNotFoundError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async getUserRoles(@Param('id') id: string, @Body() getUserRolesDto: GetUserRolesDto) {
        this.logger.log(`Getting roles for user: ${id}`, 'UsersController');
        return this.usersService.getUserRoles(id, getUserRolesDto);
    }

    @Post(':id/roles')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Assign a role to a user',
        description: 'Assign a specific role to a user in the workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiBody({
        type: AssignRoleToUserDto,
        description: 'Role assignment data'
    })
    @ApiCreatedResponse({
        description: 'Role assigned to user successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                    },
                },
                role: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiNotFoundError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async assignRoleToUser(@Param('id') id: string, @Body() assignRoleToUserDto: AssignRoleToUserDto) {
        this.logger.log(`Assigning role to user: ${id}`, 'UsersController');
        return this.usersService.assignRoleToUser(id, assignRoleToUserDto);
    }

    @Get(':id/permissions')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get permissions for a user',
        description: 'Retrieve all permissions assigned to a user through their role'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'User permissions retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                    },
                },
                role: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                    },
                },
                permissions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' },
                        },
                    },
                },
            },
        },
    })
    @ApiNotFoundError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async getUserPermissions(@Param('id') id: string, @Body() getUserPermissionsDto: GetUserPermissionsDto) {
        this.logger.log(`Getting permissions for user: ${id}`, 'UsersController');
        return this.usersService.getUserPermissions(id, getUserPermissionsDto);
    }

    @Delete(':id/roles/:roleId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Remove a role from a user',
        description: 'Remove a specific role from a user'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiParam({
        name: 'roleId',
        description: 'Role ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'Role removed from user successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                    },
                },
            },
        },
    })
    @ApiNotFoundError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async removeRoleFromUser(
        @Param('id') id: string,
        @Param('roleId') roleId: string,
        @Body() removeRoleFromUserDto: RemoveRoleFromUserDto
    ) {
        this.logger.log(`Removing role ${roleId} from user: ${id}`, 'UsersController');
        return this.usersService.removeRoleFromUser(id, roleId, removeRoleFromUserDto);
    }

    @Delete(':id')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({
        summary: 'Delete a user',
        description: 'Delete a user from the current workspace (soft delete)'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'User deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User deleted successfully' },
            },
        },
    })
    @ApiNotFoundError()
    @ApiBadRequestError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Deleting user: ${id}`, 'UsersController');
        return this.usersService.deleteUser(id, req);
    }

    @Get(':id')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get a user by ID',
        description: 'Retrieve a specific user by their ID'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'User retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                status: { type: 'string' },
                workspaceId: { type: 'string' },
                roleId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiNotFoundError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Retrieving user: ${id}`, 'UsersController');
        return this.usersService.getUserById(id, req);
    }

    @Put(':id')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Update a user',
        description: 'Update an existing user in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    @ApiBody({
        type: UpdateUserDto,
        description: 'User update data'
    })
    @ApiOkResponse({
        description: 'User updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                status: { type: 'string' },
                workspaceId: { type: 'string' },
                roleId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiValidationError()
    @ApiNotFoundError()
    @ApiBadRequestError()
    @ApiConflictError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @Request() req: AuthenticatedRequest,
    ) {
        this.logger.log(`Updating user: ${id}`, 'UsersController');
        return this.usersService.updateUser(id, updateUserDto, req);
    }
} 