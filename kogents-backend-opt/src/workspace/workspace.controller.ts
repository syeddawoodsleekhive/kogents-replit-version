import {
    Body,
    Controller,
    Post,
    Get,
    Param,
    HttpStatus,
    HttpCode,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { WorkspaceService } from './workspace.service';
import { Public } from '../common/decorators/public.decorator';
import { CreateWorkspaceForSignupDto } from '../auth/dtos/signup-session.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';
import {
    ApiValidationError,
    ApiConflictError,
    ApiNotFoundError,
    ApiInternalServerError
} from '../common/decorators/api-error-response.decorator';

@ApiTags('Workspace Management')
@Controller('workspace')
@UseGuards(ThrottlerGuard)
export class WorkspaceController {
    constructor(
        private readonly workspaceService: WorkspaceService,
        private readonly logger: AppLoggerService
    ) { }

    @Public()
    @Post()
    @Throttle({ account_creation: { limit: 3, ttl: 60 * 60 * 1000 } }) // 3 per hour
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create workspace for admin registration (Step 2)',
        description: 'Add workspace details to existing admin registration. This stores workspace data in Redis for later database commit after email verification.'
    })
    @ApiBody({
        type: CreateWorkspaceForSignupDto,
        description: 'Admin workspace creation data with session ID'
    })
    @ApiCreatedResponse({
        description: 'Workspace added to admin registration successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Workspace added to admin registration' },
                step: { type: 'string', enum: ['workspace_created'] },
                workspace: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        slug: { type: 'string' }
                    }
                },
                timeRemaining: { type: 'number', description: 'Registration time remaining in seconds' }
            }
        }
    })
    @ApiValidationError()
    @ApiConflictError()
    @ApiInternalServerError()
    async createWorkspaceForSignup(@Body() dto: CreateWorkspaceForSignupDto) {
        this.logger.log(`Workspace creation for signup session: ${dto.sessionId}, name: ${dto.name}, slug: ${dto.slug}`, 'WorkspaceController');

        try {
            const workspaceData = {
                name: dto.name,
                slug: dto.slug,
                branding: dto.branding
            };

            // Use the new direct method from WorkspaceService
            const result = await this.workspaceService.createWorkspaceForPendingUser(
                dto.sessionId,
                workspaceData
            );

            this.logger.log(`Workspace successfully added to signup session: ${dto.sessionId}`, 'WorkspaceController');

            return result;
        } catch (error) {
            this.logger.error(`Workspace creation failed for signup session: ${dto.sessionId}`, 'WorkspaceController', error);
            throw error;
        }
    }

    @Public()
    @Get("slug/:slug")
    @ApiOperation({
        summary: 'Get workspace by slug',
        description: 'Retrieve detailed workspace information by slug including users, roles, and permissions'
    })
    @ApiParam({
        name: 'slug',
        description: 'Workspace slug',
        type: 'string'
    })
    @ApiOkResponse({
        description: 'Workspace details retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                apiToken: { type: 'string' },
                branding: { type: 'object' },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                admin: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        avatarUrl: { type: 'string' }
                    }
                },
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            avatarUrl: { type: 'string' },
                            status: { type: 'string' },
                            role: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                roles: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            permissions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        userId: { type: 'string' },
                                        canView: { type: 'boolean' },
                                        canCreate: { type: 'boolean' },
                                        canEdit: { type: 'boolean' },
                                        canDelete: { type: 'boolean' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiNotFoundError()
    @ApiInternalServerError()
    async getWorkspaceBySlug(@Param('slug') slug: string) {
        this.logger.log(`Getting workspace by slug: ${slug}`, 'WorkspaceController');

        try {
            const workspace = await this.workspaceService.getWorkspaceBySlug(slug);
            this.logger.log(`Workspace retrieved successfully by slug: ${slug}`, 'WorkspaceController');
            return workspace;
        } catch (error) {
            this.logger.error(`Failed to get workspace by slug ${slug}: ${error.message}`, error.stack, 'WorkspaceController');
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get workspace by ID',
        description: 'Retrieve detailed workspace information including users, roles, and permissions'
    })
    @ApiParam({
        name: 'id',
        description: 'Workspace ID',
        type: 'string'
    })
    @ApiOkResponse({
        description: 'Workspace details retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                apiToken: { type: 'string' },
                branding: { type: 'object' },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                admin: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        avatarUrl: { type: 'string' }
                    }
                },
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            avatarUrl: { type: 'string' },
                            status: { type: 'string' },
                            role: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                roles: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            permissions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        userId: { type: 'string' },
                                        canView: { type: 'boolean' },
                                        canCreate: { type: 'boolean' },
                                        canEdit: { type: 'boolean' },
                                        canDelete: { type: 'boolean' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiNotFoundError()
    @ApiInternalServerError()
    async getWorkspaceById(@Param('id') id: string) {
        this.logger.log(`Getting workspace by ID: ${id}`, 'WorkspaceController');

        try {
            const workspace = await this.workspaceService.getWorkspaceById(id);
            this.logger.log(`Workspace retrieved successfully: ${id}`, 'WorkspaceController');
            return workspace;
        } catch (error) {
            this.logger.error(`Failed to get workspace ${id}: ${error.message}`, error.stack, 'WorkspaceController');
            throw error;
        }
    }
}