import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateUserDto,
    UserResponseDto,
    GetUsersDto,
    UsersResponseDto,
    UpdateUserDto,
    UpdateProfileDto,
    GetUserRolesDto,
    AssignRoleToUserDto,
    RemoveRoleFromUserDto,
    GetUserPermissionsDto
} from './dtos';
import { AuthenticatedRequest } from '../common/types/auth-request.interface';
import { AppLoggerService } from '../common/logger/app-logger.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
    ) { }

    async createUser(createUserDto: CreateUserDto, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Creating user in workspace ${workspaceId}: ${createUserDto.email}`, 'UsersService');

        // Check if user already exists in the workspace
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: createUserDto.email,
                workspaceId: workspaceId,
            },
        });

        if (existingUser) {
            this.logger.warn(`User creation failed - email already exists in workspace: ${createUserDto.email}`, 'UsersService');
            throw new ConflictException('User with this email already exists in the workspace');
        }

        // Check if role exists in the workspace
        const existingRole = await this.prisma.role.findFirst({
            where: {
                name: createUserDto.role_name,
                workspaceId: workspaceId,
            },
        });

        if (!existingRole) {
            this.logger.warn(`Role not found: ${createUserDto.role_name} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException(`Role '${createUserDto.role_name}' not found in workspace`);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

        // Create user with role assignment
        const user = await this.prisma.user.create({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                password: hashedPassword,
                phone: createUserDto.phone,
                status: createUserDto.status,
                avatarUrl: createUserDto.avatarUrl,
                workspaceId: workspaceId,
                roleId: existingRole.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                avatarUrl: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
                lastActiveAt: true,
                role: {
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
                },
                workspace: true,
            }
        });

        this.logger.log(`User created successfully: ${user.email} with role: ${user.role?.name}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status as any,
            avatarUrl: user.avatarUrl,
            workspaceId: user.workspaceId!,
            workspace: {
                id: user.workspaceId!,
                name: user.workspace?.name!,
                slug: user.workspace?.slug!,
            },
            createdAt: user.createdAt || undefined,
            updatedAt: user.updatedAt || undefined,
            lastActiveAt: user.lastActiveAt || undefined,
            role: {
                id: user.role!.id,
                name: user.role!.name,
                description: user.role!.description,
                isSystem: user.role!.isSystem,
                isActive: user.role!.isActive,
            },
            permissions: user.role!.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })),
        };

        return response;
    }

    async getAllUsers(query: GetUsersDto, req: AuthenticatedRequest): Promise<UsersResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Getting users for workspace ${workspaceId} with filters: ${JSON.stringify(query)}`, 'UsersService');

        const { page = 1, limit = 10, search, status, role, sortBy = 'name', sortOrder = 'asc' } = query;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            workspaceId: workspaceId,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (role) {
            where.role = {
                name: { contains: role, mode: 'insensitive' },
            };
        }

        // Build orderBy clause
        const orderBy: any = {};
        if (sortBy === 'name') {
            orderBy.name = sortOrder;
        } else if (sortBy === 'email') {
            orderBy.email = sortOrder;
        } else if (sortBy === 'status') {
            orderBy.status = sortOrder;
        } else {
            orderBy.name = 'asc'; // Default sort
        }

        // Get users with role and permissions
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    },
                    workspace: true,
                },
                skip,
                take: limit,
                orderBy,
            }),
            this.prisma.user.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        // Transform to response DTOs
        const userResponses: UserResponseDto[] = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status as any,
            avatarUrl: user.avatarUrl,
            workspaceId: user.workspaceId!,
            workspace: {
                id: user.workspaceId!,
                name: user.workspace?.name!,
                slug: user.workspace?.slug!,
            },
            createdAt: user.createdAt || undefined,
            updatedAt: user.updatedAt || undefined,
            lastActiveAt: user.lastActiveAt || undefined,
            role: user.role ? {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description,
                isSystem: user.role.isSystem,
                isActive: user.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: user.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        }));

        this.logger.log(`Retrieved ${userResponses.length} users from workspace ${workspaceId}`, 'UsersService');

        return {
            users: userResponses,
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        };
    }

    async getUserById(userId: string, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Getting user ${userId} from workspace ${workspaceId}`, 'UsersService');

        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            },
        });

        if (!user) {
            this.logger.warn(`User not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        this.logger.log(`Retrieved user ${user.email} from workspace ${workspaceId}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status as any,
            avatarUrl: user.avatarUrl,
            workspaceId: user.workspaceId!,
            workspace: {
                id: user.workspaceId!,
                name: user.workspace?.name!,
                slug: user.workspace?.slug!,
            },
            createdAt: user.createdAt || undefined,
            updatedAt: user.updatedAt || undefined,
            lastActiveAt: user.lastActiveAt || undefined,
            role: user.role ? {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description,
                isSystem: user.role.isSystem,
                isActive: user.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: user.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        };

        return response;
    }

    async updateUser(userId: string, updateUserDto: UpdateUserDto, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Updating user ${userId} in workspace ${workspaceId}`, 'UsersService');

        // Check if user exists in the workspace
        const existingUser = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            },
        });

        if (!existingUser) {
            this.logger.warn(`User ${userId} not found in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Check if email is being updated and if it conflicts with another user
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailConflict = await this.prisma.user.findFirst({
                where: {
                    email: updateUserDto.email,
                    workspaceId: workspaceId,
                    id: { not: userId }, // Exclude current user
                },
            });

            if (emailConflict) {
                this.logger.warn(`Email update failed - email already exists: ${updateUserDto.email}`, 'UsersService');
                throw new ConflictException('User with this email already exists in the workspace');
            }
        }

        // Handle role update
        let roleId = existingUser.roleId;
        if (updateUserDto.role_name && updateUserDto.role_name !== existingUser.role?.name) {
            // Check if role exists in the workspace
            const existingRole = await this.prisma.role.findFirst({
                where: {
                    name: updateUserDto.role_name,
                    workspaceId: workspaceId,
                },
            });

            if (!existingRole) {
                this.logger.warn(`Role not found: ${updateUserDto.role_name} in workspace ${workspaceId}`, 'UsersService');
                throw new NotFoundException(`Role '${updateUserDto.role_name}' not found in workspace`);
            }

            roleId = existingRole.id;
            this.logger.log(`Updating user role to: ${updateUserDto.role_name}`, 'UsersService');
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (updateUserDto.password) {
            hashedPassword = await bcrypt.hash(updateUserDto.password, 12);
        }

        // Update user in a transaction
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(updateUserDto.name && { name: updateUserDto.name }),
                ...(updateUserDto.email && { email: updateUserDto.email }),
                ...(hashedPassword && { password: hashedPassword }),
                ...(updateUserDto.phone !== undefined && { phone: updateUserDto.phone }),
                ...(updateUserDto.status && { status: updateUserDto.status }),
                ...(updateUserDto.avatarUrl !== undefined && { avatarUrl: updateUserDto.avatarUrl }),
                ...(roleId !== existingUser.roleId && { roleId }),
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            }
        });

        this.logger.log(`User ${updatedUser.email} updated successfully in workspace ${workspaceId}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            status: updatedUser.status as any,
            avatarUrl: updatedUser.avatarUrl,
            workspaceId: updatedUser.workspaceId!,
            workspace: {
                id: updatedUser.workspaceId!,
                name: updatedUser.workspace?.name!,
                slug: updatedUser.workspace?.slug!,
            },
            createdAt: updatedUser.createdAt || undefined,
            updatedAt: updatedUser.updatedAt || undefined,
            lastActiveAt: updatedUser.lastActiveAt || undefined,
            role: updatedUser.role ? {
                id: updatedUser.role.id,
                name: updatedUser.role.name,
                description: updatedUser.role.description,
                isSystem: updatedUser.role.isSystem,
                isActive: updatedUser.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: updatedUser.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        };

        return response;
    }

    async deleteUser(userId: string, req: AuthenticatedRequest): Promise<{ message: string }> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Deleting user ${userId} from workspace ${workspaceId}`, 'UsersService');

        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                workspace: true,
            },
        });

        if (!user) {
            this.logger.warn(`User not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Check if user is the workspace admin
        if (user.workspace?.adminId === userId) {
            this.logger.warn(`Cannot delete workspace admin: ${userId}`, 'UsersService');
            throw new ForbiddenException('Cannot delete workspace administrator');
        }

        // Delete user in a transaction
        await this.prisma.$transaction(async (tx) => {
            // Delete the user (role assignments will be handled by cascade)
            await tx.user.delete({
                where: { id: userId },
            });
        });

        this.logger.log(`User ${user.email} deleted successfully from workspace ${workspaceId}`, 'UsersService');

        return {
            message: `User ${user.email} has been deleted successfully`,
        };
    }

    async activateUser(userId: string, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Activating user ${userId} in workspace ${workspaceId}`, 'UsersService');

        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            },
        });

        if (!user) {
            this.logger.warn(`User not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Update user status to active
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            },
        });

        this.logger.log(`User ${updatedUser.email} activated successfully in workspace ${workspaceId}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            status: updatedUser.status as any,
            avatarUrl: updatedUser.avatarUrl,
            workspaceId: updatedUser.workspaceId!,
            workspace: {
                id: updatedUser.workspaceId!,
                name: updatedUser.workspace?.name!,
                slug: updatedUser.workspace?.slug!,
            },
            createdAt: updatedUser.createdAt || undefined,
            updatedAt: updatedUser.updatedAt || undefined,
            lastActiveAt: updatedUser.lastActiveAt || undefined,
            role: updatedUser.role ? {
                id: updatedUser.role.id,
                name: updatedUser.role.name,
                description: updatedUser.role.description,
                isSystem: updatedUser.role.isSystem,
                isActive: updatedUser.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: updatedUser.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        };

        return response;
    }

    async deactivateUser(userId: string, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Deactivating user ${userId} in workspace ${workspaceId}`, 'UsersService');

        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            },
        });

        if (!user) {
            this.logger.warn(`User not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Update user status to inactive and record last active time
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: 'INACTIVE',
                lastActiveAt: new Date() // Record when user was last active before deactivation
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            },
        });

        this.logger.log(`User ${updatedUser.email} deactivated successfully in workspace ${workspaceId}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            status: updatedUser.status as any,
            avatarUrl: updatedUser.avatarUrl,
            workspaceId: updatedUser.workspaceId!,
            workspace: {
                id: updatedUser.workspaceId!,
                name: updatedUser.workspace?.name!,
                slug: updatedUser.workspace?.slug!,
            },
            createdAt: updatedUser.createdAt || undefined,
            updatedAt: updatedUser.updatedAt || undefined,
            lastActiveAt: updatedUser.lastActiveAt || undefined,
            role: updatedUser.role ? {
                id: updatedUser.role.id,
                name: updatedUser.role.name,
                description: updatedUser.role.description,
                isSystem: updatedUser.role.isSystem,
                isActive: updatedUser.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: updatedUser.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        };

        return response;
    }

    async suspendUser(userId: string, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Suspending user ${userId} in workspace ${workspaceId}`, 'UsersService');

        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            },
        });

        if (!user) {
            this.logger.warn(`User not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Update user status to suspended
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'SUSPENDED' },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            },
        });

        this.logger.log(`User ${updatedUser.email} suspended successfully in workspace ${workspaceId}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            status: updatedUser.status as any,
            avatarUrl: updatedUser.avatarUrl,
            workspaceId: updatedUser.workspaceId!,
            workspace: {
                id: updatedUser.workspaceId!,
                name: updatedUser.workspace?.name!,
                slug: updatedUser.workspace?.slug!,
            },
            createdAt: updatedUser.createdAt || undefined,
            updatedAt: updatedUser.updatedAt || undefined,
            lastActiveAt: updatedUser.lastActiveAt || undefined,
            role: updatedUser.role ? {
                id: updatedUser.role.id,
                name: updatedUser.role.name,
                description: updatedUser.role.description,
                isSystem: updatedUser.role.isSystem,
                isActive: updatedUser.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: updatedUser.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        };

        return response;
    }

    async setUserPending(userId: string, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Setting user ${userId} to pending in workspace ${workspaceId}`, 'UsersService');

        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            },
        });

        if (!user) {
            this.logger.warn(`User not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Update user status to pending
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'PENDING' },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            },
        });

        this.logger.log(`User ${updatedUser.email} set to pending successfully in workspace ${workspaceId}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            status: updatedUser.status as any,
            avatarUrl: updatedUser.avatarUrl,
            workspaceId: updatedUser.workspaceId!,
            workspace: {
                id: updatedUser.workspaceId!,
                name: updatedUser.workspace?.name!,
                slug: updatedUser.workspace?.slug!,
            },
            createdAt: updatedUser.createdAt || undefined,
            updatedAt: updatedUser.updatedAt || undefined,
            lastActiveAt: updatedUser.lastActiveAt || undefined,
            role: updatedUser.role ? {
                id: updatedUser.role.id,
                name: updatedUser.role.name,
                description: updatedUser.role.description,
                isSystem: updatedUser.role.isSystem,
                isActive: updatedUser.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: updatedUser.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        };

        return response;
    }

    /**
     * Get roles for a user
     */
    async getUserRoles(userId: string, getUserRolesDto: GetUserRolesDto) {
        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: getUserRolesDto.workspaceId,
            },
        });

        if (!user) {
            this.logger.warn(`User roles retrieval failed: user not found → ${userId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Get user's role with permissions
        const userWithRole = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: getUserRolesDto.workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!userWithRole?.role) {
            this.logger.log(`User ${userId} has no role assigned`, 'UsersService');
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
                role: null,
            };
        }

        this.logger.log(`Retrieved role for user: ${user.name}`, 'UsersService');
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            role: {
                id: userWithRole.role.id,
                name: userWithRole.role.name,
                description: userWithRole.role.description,
                isSystem: userWithRole.role.isSystem,
                isActive: userWithRole.role.isActive,
                permissions: userWithRole.role.rolePermissions.map(rp => ({
                    id: rp.permission.id,
                    name: rp.permission.name,
                    description: rp.permission.description,
                    category: rp.permission.category,
                })),
            },
        };
    }

    /**
     * Assign a role to a user
     */
    async assignRoleToUser(userId: string, assignRoleToUserDto: AssignRoleToUserDto) {
        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: assignRoleToUserDto.workspaceId,
            },
        });

        if (!user) {
            this.logger.warn(`Role assignment failed: user not found → ${userId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Check if role exists in the workspace
        const role = await this.prisma.role.findFirst({
            where: {
                id: assignRoleToUserDto.roleId,
                workspaceId: assignRoleToUserDto.workspaceId,
                isActive: true,
            },
        });

        if (!role) {
            this.logger.warn(`Role assignment failed: role not found → ${assignRoleToUserDto.roleId}`, 'UsersService');
            throw new NotFoundException('Role not found');
        }

        // Update user's role
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { roleId: assignRoleToUserDto.roleId },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(`Role assigned to user: ${updatedUser.name} → ${role.name}`, 'UsersService');
        return {
            message: 'Role assigned to user successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
            },
            role: {
                id: role.id,
                name: role.name,
                description: role.description,
            },
        };
    }

    /**
     * Remove role from a user
     */
    async removeRoleFromUser(userId: string, roleId: string, removeRoleFromUserDto: RemoveRoleFromUserDto) {
        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: removeRoleFromUserDto.workspaceId,
            },
            include: {
                role: true,
            },
        });

        if (!user) {
            this.logger.warn(`Role removal failed: user not found → ${userId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        // Check if user has the specified role
        if (!user.role || user.role.id !== roleId) {
            this.logger.warn(`Role removal failed: user does not have role → ${userId}`, 'UsersService');
            throw new NotFoundException('User does not have this role assigned');
        }

        // Remove role from user
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { roleId: null },
        });

        this.logger.log(`Role removed from user: ${updatedUser.name}`, 'UsersService');
        return {
            message: 'Role removed from user successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
            },
        };
    }

    /**
     * Get permissions for a user
     */
    async getUserPermissions(userId: string, getUserPermissionsDto: GetUserPermissionsDto) {
        // Check if user exists in the workspace
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: getUserPermissionsDto.workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            this.logger.warn(`User permissions retrieval failed: user not found → ${userId}`, 'UsersService');
            throw new NotFoundException('User not found');
        }

        if (!user.role) {
            this.logger.log(`User ${userId} has no role assigned`, 'UsersService');
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
                permissions: [],
            };
        }

        const permissions = user.role.rolePermissions.map(rp => ({
            id: rp.permission.id,
            name: rp.permission.name,
            description: rp.permission.description,
            category: rp.permission.category,
        }));

        this.logger.log(`Retrieved ${permissions.length} permissions for user: ${user.name}`, 'UsersService');
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            role: {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description,
            },
            permissions,
        };
    }

    /**
     * Update current user's profile
     */
    async updateProfile(updateProfileDto: UpdateProfileDto, req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { userId, workspaceId } = req.user;

        if (!userId || !workspaceId) {
            throw new ForbiddenException('User must be authenticated and associated with a workspace');
        }

        this.logger.log(`Updating profile for current user: ${userId} in workspace ${workspaceId}`, 'UsersService');

        // Check if user exists in the workspace
        const existingUser = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            },
        });

        if (!existingUser) {
            this.logger.warn(`Current user profile not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User profile not found');
        }

        // Check if email is being updated and if it conflicts with another user
        if (updateProfileDto.email && updateProfileDto.email !== existingUser.email) {
            const emailConflict = await this.prisma.user.findFirst({
                where: {
                    email: updateProfileDto.email,
                    workspaceId: workspaceId,
                    id: { not: userId }, // Exclude current user
                },
            });

            if (emailConflict) {
                this.logger.warn(`Email update failed - email already exists: ${updateProfileDto.email}`, 'UsersService');
                throw new ConflictException('User with this email already exists in the workspace');
            }
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (updateProfileDto.password) {
            hashedPassword = await bcrypt.hash(updateProfileDto.password, 12);
        }

        // Update user profile (restricted to own profile only)
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(updateProfileDto.name && { name: updateProfileDto.name }),
                ...(updateProfileDto.email && { email: updateProfileDto.email }),
                ...(hashedPassword && { password: hashedPassword }),
                ...(updateProfileDto.phone !== undefined && { phone: updateProfileDto.phone }),
                ...(updateProfileDto.avatarUrl !== undefined && { avatarUrl: updateProfileDto.avatarUrl }),
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            }
        });

        this.logger.log(`Profile updated successfully for user: ${updatedUser.email}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            status: updatedUser.status as any,
            avatarUrl: updatedUser.avatarUrl,
            workspaceId: updatedUser.workspaceId!,
            workspace: {
                id: updatedUser.workspaceId!,
                name: updatedUser.workspace?.name!,
                slug: updatedUser.workspace?.slug!,
            },
            createdAt: updatedUser.createdAt || undefined,
            updatedAt: updatedUser.updatedAt || undefined,
            lastActiveAt: updatedUser.lastActiveAt || undefined,
            role: updatedUser.role ? {
                id: updatedUser.role.id,
                name: updatedUser.role.name,
                description: updatedUser.role.description,
                isSystem: updatedUser.role.isSystem,
                isActive: updatedUser.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: updatedUser.role?.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) || [],
        };

        return response;
    }

    /**
     * Get current user's profile
     */
    async getCurrentUserProfile(req: AuthenticatedRequest): Promise<UserResponseDto> {
        const { userId, workspaceId } = req.user;

        if (!userId || !workspaceId) {
            throw new ForbiddenException('User must be authenticated and associated with a workspace');
        }

        this.logger.log(`Getting profile for current user: ${userId} in workspace ${workspaceId}`, 'UsersService');

        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                workspaceId: workspaceId,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                workspace: true,
            }
        });

        if (!user) {
            this.logger.warn(`Current user profile not found: ${userId} in workspace ${workspaceId}`, 'UsersService');
            throw new NotFoundException('User profile not found');
        }

        this.logger.log(`Retrieved profile for user: ${user.name}`, 'UsersService');

        // Return the response DTO
        const response: UserResponseDto = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status as any,
            avatarUrl: user.avatarUrl,
            workspaceId: user.workspaceId!,
            createdAt: user.createdAt || undefined,
            updatedAt: user.updatedAt || undefined,
            lastActiveAt: user.lastActiveAt || undefined,
            workspace: {
                id: user.workspaceId!,
                name: user.workspace?.name!,
                slug: user.workspace?.slug!,
            },
            role: user.role ? {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description,
                isSystem: user.role.isSystem,
                isActive: user.role.isActive,
            } : {
                id: '',
                name: 'No Role',
                description: 'No role assigned',
                isSystem: false,
                isActive: false,
            },
            permissions: user.role ? user.role.rolePermissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })) : [],
        };

        return response;
    }

    async validateAgent(agentId: string, workspaceId: string): Promise<any> {
        try {
            const agent = await this.prisma.user.findFirst({
                where: {
                    id: agentId,
                    workspaceId: workspaceId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                    workspaceId: true,
                    userDepartments: {
                        select: {
                            departmentId: true,
                            department: {
                                select: {
                                    name: true,
                                }
                            }
                        }
                    }
                },
            });

            return agent;
        } catch (error) {
            this.logger.error(`Validate agent error: ${error.message}`, 'UsersService');
            return null;
        }
    }
} 