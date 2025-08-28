import { Injectable, ConflictException, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { Queue } from 'bullmq';
import { SecureRedisCache } from '../common/services/secure-redis-cache.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { PendingUserData, PendingWorkspaceData, SignupResponse } from '../common/types/pending-user.interface';
import { SignupStep } from '../auth/dtos/signup-session.dto';

@Injectable()
export class WorkspaceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly secureRedisCache: SecureRedisCache,
        private readonly appLogger: AppLoggerService
    ) { }

    /**
     * Add workspace data to pending user signup
     */
    async createWorkspaceForPendingUser(
        sessionId: string,
        workspaceDto: CreateWorkspaceDto
    ): Promise<SignupResponse> {
        const pendingUser = await this.secureRedisCache.getPendingUserBySession(sessionId);

        if (!pendingUser) {
            throw new NotFoundException('Signup data not found or expired');
        }

        // Validate session step - user must be at SIGNUP step
        if (pendingUser.step !== SignupStep.SIGNUP) {
            this.appLogger.warn(`Invalid step for workspace creation: ${pendingUser.step} (Session: ${sessionId})`, 'WorkspaceService');
            throw new BadRequestException(`Cannot create workspace at step '${pendingUser.step}'. User must be at 'signup' step.`);
        }

        // Ensure user hasn't already created a workspace in this signup
        if (pendingUser.workspace) {
            this.appLogger.warn(`Workspace already exists for signup session: ${sessionId}`, 'WorkspaceService');
            throw new ConflictException('Workspace already created for this signup');
        }

        // Check if workspace slug is available
        const existingWorkspace = await this.prisma.workspace.findUnique({
            where: { slug: workspaceDto.slug },
        });

        if (existingWorkspace) {
            throw new ConflictException('Workspace slug is already taken');
        }

        const workspaceData: PendingWorkspaceData = {
            name: workspaceDto.name,
            slug: workspaceDto.slug,
            branding: workspaceDto.branding,
        };

        const updatedUserData: Partial<PendingUserData> = {
            workspace: workspaceData,
            step: SignupStep.WORKSPACE_CREATED,
        };

        await this.secureRedisCache.updatePendingUserBySession(sessionId, updatedUserData);

        this.appLogger.log(`Workspace added to pending user session: ${sessionId} (${workspaceDto.slug})`, 'WorkspaceService');

        return {
            step: SignupStep.WORKSPACE_CREATED,
            email: pendingUser.email,
            sessionId: pendingUser.sessionId,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
    }

    /**
     * Create workspace for Redis-cached signup (legacy method for backward compatibility)
     */
    async createForSignup(email: string, workspaceData: CreateWorkspaceDto) {
        this.appLogger.log(`Adding workspace to signup: ${email} (${workspaceData.slug})`, 'WorkspaceService');

        // Use the new method
        const result = await this.createWorkspaceForPendingUser(
            email,
            workspaceData
        );

        this.appLogger.log(`Workspace added to signup: ${email} (${workspaceData.slug})`, 'WorkspaceService');

        return result;
    }

    /**
     * Get workspace by ID
     */
    async getWorkspaceById(id: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id },
            include: {
                admin: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    }
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        status: true,
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            }
                        }
                    }
                },
                roles: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isSystem: true,
                        isActive: true,
                        rolePermissions: {
                            select: {
                                permission: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        category: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        return workspace;
    }

    /**
     * Get workspace by slug
     */
    async getWorkspaceBySlug(slug: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { slug },
            include: {
                admin: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    }
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        status: true,
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            }
                        }
                    }
                },
                roles: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isSystem: true,
                        isActive: true,
                        rolePermissions: {
                            select: {
                                permission: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        category: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        return workspace;
    }


}
