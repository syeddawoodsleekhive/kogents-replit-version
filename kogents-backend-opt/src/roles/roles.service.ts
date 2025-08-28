import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { AuthenticatedRequest } from '../common/types/auth-request.interface';
import {
    CreateRoleDto,
    UpdateRoleDto,
    UpdateRolePermissionsDto,
    AddRolePermissionDto,
    RemoveRolePermissionDto
} from './dtos';

@Injectable()
export class RolesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
    ) { }

    /**
     * Get all roles for a workspace
     */
    async findAll(req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        const roles = await this.prisma.role.findMany({
            where: {
                workspaceId: workspaceId,
                isActive: true,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        rolePermissions: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        this.logger.log(`Retrieved ${roles.length} roles for workspace: ${workspaceId}`, 'RolesService');
        return roles;
    }

    /**
     * Create a new role
     */
    async create(createRoleDto: CreateRoleDto, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role name already exists in workspace
        const existingRole = await this.prisma.role.findFirst({
            where: {
                workspaceId: workspaceId,
                name: createRoleDto.name,
                isActive: true,
            },
        });

        if (existingRole) {
            this.logger.warn(`Role creation failed: name already exists → ${createRoleDto.name}`, 'RolesService');
            throw new ConflictException('Role with this name already exists in the workspace');
        }

        const role = await this.prisma.role.create({
            data: {
                name: createRoleDto.name,
                description: createRoleDto.description || '',
                workspaceId: workspaceId,
                isSystem: false,
                isActive: true,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        rolePermissions: true,
                    },
                },
            },
        });

        this.logger.log(`Role created: ${role.name} in workspace: ${workspaceId}`, 'RolesService');
        return role;
    }

    /**
     * Get a role by ID
     */
    async findOne(roleId: string, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        const role = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                rolePermissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        rolePermissions: true,
                    },
                },
            },
        });

        if (!role) {
            this.logger.warn(`Role not found: ${roleId} in workspace: ${workspaceId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        this.logger.log(`Retrieved role: ${role.name}`, 'RolesService');
        return role;
    }

    /**
     * Update a role
     */
    async update(roleId: string, updateRoleDto: UpdateRoleDto, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role exists
        const existingRole = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
        });

        if (!existingRole) {
            this.logger.warn(`Role update failed: not found → ${roleId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        // Prevent updating system roles
        if (existingRole.isSystem) {
            this.logger.warn(`Role update failed: cannot update system role → ${roleId}`, 'RolesService');
            throw new BadRequestException('Cannot update system roles');
        }

        // Check if new name conflicts with existing role
        if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
            const nameConflict = await this.prisma.role.findFirst({
                where: {
                    workspaceId: workspaceId,
                    name: updateRoleDto.name,
                    isActive: true,
                    id: { not: roleId },
                },
            });

            if (nameConflict) {
                this.logger.warn(`Role update failed: name conflict → ${updateRoleDto.name}`, 'RolesService');
                throw new ConflictException('Role with this name already exists');
            }
        }

        const updatedRole = await this.prisma.role.update({
            where: { id: roleId },
            data: {
                name: updateRoleDto.name,
                description: updateRoleDto.description,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        rolePermissions: true,
                    },
                },
            },
        });

        this.logger.log(`Role updated: ${updatedRole.name}`, 'RolesService');
        return updatedRole;
    }

    /**
     * Delete a role
     */
    async remove(roleId: string, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role exists
        const existingRole = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
        });

        if (!existingRole) {
            this.logger.warn(`Role deletion failed: not found → ${roleId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        // Prevent deleting system roles
        if (existingRole.isSystem) {
            this.logger.warn(`Role deletion failed: cannot delete system role → ${roleId}`, 'RolesService');
            throw new BadRequestException('Cannot delete system roles');
        }

        // Check if role has users assigned
        const usersWithRole = await this.prisma.user.count({
            where: {
                roleId: roleId,
                workspaceId: workspaceId,
            },
        });

        if (usersWithRole > 0) {
            this.logger.warn(`Role deletion failed: has ${usersWithRole} users assigned → ${roleId}`, 'RolesService');
            throw new BadRequestException('Cannot delete role with assigned users. Please reassign users first.');
        }

        // Soft delete the role
        await this.prisma.role.update({
            where: { id: roleId },
            data: { isActive: false },
        });

        this.logger.log(`Role deleted: ${existingRole.name}`, 'RolesService');
        return { message: 'Role deleted successfully' };
    }

    /**
     * Get users assigned to a role
     */
    async getRoleUsers(roleId: string, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role exists
        const role = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
        });

        if (!role) {
            this.logger.warn(`Role users retrieval failed: role not found → ${roleId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        const users = await this.prisma.user.findMany({
            where: {
                roleId,
                workspaceId: workspaceId,
                status: 'ACTIVE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        this.logger.log(`Retrieved ${users.length} users for role: ${role.name}`, 'RolesService');
        return users;
    }

    /**
     * Get permissions for a role
     */
    async getRolePermissions(roleId: string, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role exists
        const role = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
        });

        if (!role) {
            this.logger.warn(`Role permissions retrieval failed: role not found → ${roleId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        const permissions = await this.prisma.rolePermission.findMany({
            where: {
                roleId,
                role: {
                    workspaceId: workspaceId,
                },
            },
            include: {
                permission: true,
            },
            orderBy: {
                permission: {
                    name: 'asc',
                },
            },
        });

        this.logger.log(`Retrieved ${permissions.length} permissions for role: ${role.name}`, 'RolesService');
        return permissions;
    }

    /**
     * Update all permissions for a role
     */
    async updateRolePermissions(roleId: string, updateRolePermissionsDto: UpdateRolePermissionsDto, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role exists
        const role = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
        });

        if (!role) {
            this.logger.warn(`Role permissions update failed: role not found → ${roleId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        // Prevent updating system roles
        if (role.isSystem) {
            this.logger.warn(`Role permissions update failed: cannot update system role → ${roleId}`, 'RolesService');
            throw new BadRequestException('Cannot update permissions for system roles');
        }

        // Verify all permissions exist
        const permissions = await this.prisma.permission.findMany({
            where: {
                id: { in: updateRolePermissionsDto.permissionIds },
            },
        });

        if (permissions.length !== updateRolePermissionsDto.permissionIds.length) {
            this.logger.warn(`Role permissions update failed: invalid permission IDs → ${roleId}`, 'RolesService');
            throw new BadRequestException('One or more permissions not found');
        }

        // Update permissions in a transaction
        await this.prisma.$transaction(async (tx) => {
            // Remove existing permissions
            await tx.rolePermission.deleteMany({
                where: { roleId },
            });

            // Add new permissions
            if (updateRolePermissionsDto.permissionIds.length > 0) {
                await tx.rolePermission.createMany({
                    data: updateRolePermissionsDto.permissionIds.map(permissionId => ({
                        roleId,
                        permissionId,
                    })),
                });
            }
        });

        this.logger.log(`Updated permissions for role: ${role.name}`, 'RolesService');
        return { message: 'Role permissions updated successfully' };
    }

    /**
     * Add permissions to a role
     */
    async addRolePermission(roleId: string, addRolePermissionDto: AddRolePermissionDto, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role exists
        const role = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
        });

        if (!role) {
            this.logger.warn(`Role permission addition failed: role not found → ${roleId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        // Prevent updating system roles
        if (role.isSystem) {
            this.logger.warn(`Role permission addition failed: cannot update system role → ${roleId}`, 'RolesService');
            throw new BadRequestException('Cannot update permissions for system roles');
        }

        // Verify all permissions exist
        const permissions = await this.prisma.permission.findMany({
            where: {
                id: { in: addRolePermissionDto.permissionIds },
            },
        });

        if (permissions.length !== addRolePermissionDto.permissionIds.length) {
            this.logger.warn(`Role permission addition failed: invalid permission IDs → ${roleId}`, 'RolesService');
            throw new BadRequestException('One or more permissions not found');
        }

        // Check for existing permissions that are already assigned
        const existingPermissions = await this.prisma.rolePermission.findMany({
            where: {
                roleId,
                permissionId: { in: addRolePermissionDto.permissionIds },
            },
            include: {
                permission: true,
            },
        });

        if (existingPermissions.length > 0) {
            const existingPermissionNames = existingPermissions.map(ep => ep.permission.name).join(', ');
            this.logger.warn(`Role permission addition failed: permissions already assigned → ${roleId}`, 'RolesService');
            throw new ConflictException(`The following permissions are already assigned to this role: ${existingPermissionNames}`);
        }

        // Add permissions to role in a transaction
        await this.prisma.$transaction(async (tx) => {
            await tx.rolePermission.createMany({
                data: addRolePermissionDto.permissionIds.map(permissionId => ({
                    roleId,
                    permissionId,
                })),
            });
        });

        const permissionNames = permissions.map(p => p.name).join(', ');
        this.logger.log(`Added permissions [${permissionNames}] to role: ${role.name}`, 'RolesService');
        return { message: 'Permissions added to role successfully' };
    }

    /**
     * Remove a permission from a role
     */
    async removeRolePermission(roleId: string, removeRolePermissionDto: RemoveRolePermissionDto, req: AuthenticatedRequest) {
        const { workspaceId } = req.user;

        if (!workspaceId) {
            throw new BadRequestException('User must be associated with a workspace');
        }

        // Check if role exists
        const role = await this.prisma.role.findFirst({
            where: {
                id: roleId,
                workspaceId: workspaceId,
                isActive: true,
            },
        });

        if (!role) {
            this.logger.warn(`Role permission removal failed: role not found → ${roleId}`, 'RolesService');
            throw new NotFoundException('Role not found');
        }

        // Prevent updating system roles
        if (role.isSystem) {
            this.logger.warn(`Role permission removal failed: cannot update system role → ${roleId}`, 'RolesService');
            throw new BadRequestException('Cannot update permissions for system roles');
        }

        // Check if permission exists
        const permission = await this.prisma.permission.findUnique({
            where: { id: removeRolePermissionDto.permissionId },
        });

        if (!permission) {
            this.logger.warn(`Role permission removal failed: permission not found → ${removeRolePermissionDto.permissionId}`, 'RolesService');
            throw new NotFoundException('Permission not found');
        }

        // Check if permission is assigned to role
        const rolePermission = await this.prisma.rolePermission.findFirst({
            where: {
                roleId,
                permissionId: removeRolePermissionDto.permissionId,
            },
        });

        if (!rolePermission) {
            this.logger.warn(`Role permission removal failed: permission not assigned → ${roleId}`, 'RolesService');
            throw new NotFoundException('Permission is not assigned to this role');
        }

        // Remove permission from role
        await this.prisma.rolePermission.delete({
            where: { id: rolePermission.id },
        });

        this.logger.log(`Removed permission ${permission.name} from role: ${role.name}`, 'RolesService');
        return { message: 'Permission removed from role successfully' };
    }
} 