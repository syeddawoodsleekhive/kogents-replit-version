import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
    ForbiddenException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../../common/types/auth-request.interface';
import {
    ApiValidationError,
    ApiForbiddenError,
    ApiConflictError,
    ApiNotFoundError,
    ApiInternalServerError
} from '../../common/decorators/api-error-response.decorator';
import { CreateDepartmentDto } from '../dtos/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/update-department.dto';
import { AssignAgentsDto } from '../dtos/assign-agents.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { DepartmentsService } from '../services/departments.service';

@ApiTags('Departments Management')
@Controller('departments')
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class DepartmentsController {
    constructor(
        private readonly logger: AppLoggerService,
        private readonly departmentsService: DepartmentsService,
    ) { }

    @Post()
    @RequirePermissions({ canCreate: true })
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create a new department',
        description: 'Create a new department in the current workspace'
    })
    @ApiBody({
        type: CreateDepartmentDto,
        description: 'Department creation data'
    })
    @ApiCreatedResponse({
        description: 'Department created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
                icon: { type: 'string' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiValidationError()
    @ApiConflictError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async create(@Body() createDepartmentDto: CreateDepartmentDto, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Creating department: ${createDepartmentDto.name}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.createDepartment(createDepartmentDto, req.user.workspaceId);
    }

    @Get()
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get all departments',
        description: 'Get all departments in the current workspace'
    })
    @ApiOkResponse({
        description: 'Departments retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    color: { type: 'string' },
                    icon: { type: 'string' },
                    isActive: { type: 'boolean' },
                    workspaceId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    _count: {
                        type: 'object',
                        properties: {
                            users: { type: 'number' },
                        },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async findAll(@Request() req: AuthenticatedRequest) {
        this.logger.log('Getting all departments', 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.getDepartmentsByWorkspace(req.user.workspaceId);
    }

    @Get('active')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get active departments',
        description: 'Get all active departments in the current workspace'
    })
    @ApiOkResponse({
        description: 'Active departments retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    color: { type: 'string' },
                    icon: { type: 'string' },
                    isActive: { type: 'boolean' },
                    workspaceId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    _count: {
                        type: 'object',
                        properties: {
                            users: { type: 'number' },
                        },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async getActiveDepartments(@Request() req: AuthenticatedRequest) {
        this.logger.log('Getting active departments', 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.getActiveDepartmentsByWorkspace(req.user.workspaceId);
    }

    @Post(':id/agents')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Assign agents to department',
        description: 'Assign one or more agents to a department in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiBody({
        type: AssignAgentsDto,
        description: 'Agent assignment data'
    })
    @ApiOkResponse({
        description: 'Agents assigned to department successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                departmentId: { type: 'string' },
                assignedAgents: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            assignedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                totalAssigned: { type: 'number' }
            }
        }
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiConflictError()
    @ApiInternalServerError()
    async assignAgentsToDepartment(
        @Param('id') id: string,
        @Body() assignAgentsDto: AssignAgentsDto,
        @Request() req: AuthenticatedRequest
    ) {
        this.logger.log(`Assigning agents to department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.assignAgentsToDepartment(id, assignAgentsDto.agentIds, req.user.workspaceId, req.user.userId, assignAgentsDto.reason);
    }

    @Get(':id/agents')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get agents in department',
        description: 'Get all agents assigned to a specific department in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'Agents in department retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                departmentId: { type: 'string' },
                departmentName: { type: 'string' },
                agents: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            assignedAt: { type: 'string', format: 'date-time' },
                            assignedBy: { type: 'string' },
                            assignedReason: { type: 'string' }
                        }
                    }
                },
                totalAgents: { type: 'number' }
            }
        }
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async getAgentsInDepartment(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest
    ) {
        this.logger.log(`Getting agents in department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.getAgentsInDepartment(id, req.user.workspaceId);
    }

    @Delete(':id/agents')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Remove agents from department',
        description: 'Remove one or more agents from a department in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                agentIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of agent user IDs to remove from the department',
                    example: ['clx1234567890abcdef', 'clx0987654321fedcba']
                }
            },
            required: ['agentIds']
        },
        description: 'Agent removal data'
    })
    @ApiOkResponse({
        description: 'Agents removed from department successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                departmentId: { type: 'string' },
                removedAgents: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            removedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                totalRemoved: { type: 'number' }
            }
        }
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async removeAgentsFromDepartment(
        @Param('id') id: string,
        @Body() body: { agentIds: string[] },
        @Request() req: AuthenticatedRequest
    ) {
        this.logger.log(`Removing agents from department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.removeAgentsFromDepartment(id, body.agentIds, req.user.workspaceId);
    }

    @Put(':id/activate')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Activate a department',
        description: 'Activate a department in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'Department activated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
                icon: { type: 'string' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                _count: {
                    type: 'object',
                    properties: {
                        users: { type: 'number' },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async activate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Activating department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.activateDepartment(id, req.user.workspaceId);
    }

    @Put(':id/deactivate')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Deactivate a department',
        description: 'Deactivate a department in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'Department deactivated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
                icon: { type: 'string' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                _count: {
                    type: 'object',
                    properties: {
                        users: { type: 'number' },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async deactivate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Deactivating department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.deactivateDepartment(id, req.user.workspaceId);
    }

    @Put(':id')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({
        summary: 'Update a department',
        description: 'Update a department in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiBody({
        type: UpdateDepartmentDto,
        description: 'Department update data'
    })
    @ApiOkResponse({
        description: 'Department updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
                icon: { type: 'string' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                _count: {
                    type: 'object',
                    properties: {
                        users: { type: 'number' },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async update(
        @Param('id') id: string,
        @Body() updateDepartmentDto: UpdateDepartmentDto,
        @Request() req: AuthenticatedRequest
    ) {
        this.logger.log(`Updating department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.updateDepartment(id, updateDepartmentDto, req.user.workspaceId);
    }

    @Get(':id')
    @RequirePermissions({ canRead: true })
    @ApiOperation({
        summary: 'Get department by ID',
        description: 'Get a specific department by ID in the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'Department retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
                icon: { type: 'string' },
                isActive: { type: 'boolean' },
                workspaceId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                _count: {
                    type: 'object',
                    properties: {
                        users: { type: 'number' },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Getting department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.getDepartmentById(id, req.user.workspaceId);
    }

    @Delete(':id')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({
        summary: 'Delete a department',
        description: 'Delete a department from the current workspace'
    })
    @ApiParam({
        name: 'id',
        description: 'Department ID',
        example: 'clx1234567890abcdef'
    })
    @ApiOkResponse({
        description: 'Department deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                deletedDepartment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        color: { type: 'string' },
                        icon: { type: 'string' },
                        isActive: { type: 'boolean' },
                        workspaceId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        _count: {
                            type: 'object',
                            properties: {
                                users: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    })
    @ApiValidationError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        this.logger.log(`Deleting department: ${id}`, 'DepartmentsController');
        if (!req.user.workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }
        return this.departmentsService.deleteDepartment(id, req.user.workspaceId);
    }
} 