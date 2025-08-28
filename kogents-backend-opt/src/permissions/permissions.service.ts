import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import {
    CreatePermissionDto,
    UpdatePermissionDto,
    PermissionResponseDto,
    PermissionsResponseDto,
    CategoriesResponseDto
} from './dtos';

const STATIC_PERMISSION_CATEGORIES: string[] = [
    'canned-responses',
    'chat',
    'departments',
    'roles',
    'tags',
    'triggers',
    'users',
    'widget',
    'permissions',
];

@Injectable()
export class PermissionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
    ) { }

    /**
     * Get all permissions
     */
    async findAll(): Promise<PermissionsResponseDto> {
        this.logger.log('Retrieving all permissions', 'PermissionsService');

        const [permissions, total] = await Promise.all([
            this.prisma.permission.findMany({
                orderBy: {
                    name: 'asc',
                },
            }),
            this.prisma.permission.count(),
        ]);

        this.logger.log(`Retrieved ${permissions.length} permissions`, 'PermissionsService');

        return {
            permissions: permissions.map(permission => ({
                id: permission.id,
                name: permission.name,
                description: permission.description,
                category: permission.category,
                createdAt: permission.createdAt,
            })),
            total,
        };
    }

    /**
     * Get a permission by ID
     */
    async findOne(id: string): Promise<PermissionResponseDto> {
        this.logger.log(`Retrieving permission: ${id}`, 'PermissionsService');

        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });

        if (!permission) {
            this.logger.warn(`Permission not found: ${id}`, 'PermissionsService');
            throw new NotFoundException('Permission not found');
        }

        this.logger.log(`Retrieved permission: ${permission.name}`, 'PermissionsService');

        return {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            category: permission.category,
            createdAt: permission.createdAt,
        };
    }

    /**
     * Create a new permission
     */
    async create(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
        this.logger.log(`Creating permission: ${createPermissionDto.name}`, 'PermissionsService');

        // Check if permission with the same name already exists
        const existingPermission = await this.prisma.permission.findFirst({
            where: {
                name: createPermissionDto.name,
            },
        });

        if (existingPermission) {
            this.logger.warn(`Permission creation failed: name already exists → ${createPermissionDto.name}`, 'PermissionsService');
            throw new ConflictException('Permission with this name already exists');
        }

        const permission = await this.prisma.permission.create({
            data: {
                name: createPermissionDto.name,
                description: createPermissionDto.description,
                category: createPermissionDto.category,
            },
        });

        this.logger.log(`Permission created: ${permission.name}`, 'PermissionsService');

        return {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            category: permission.category,
            createdAt: permission.createdAt,
        };
    }

    /**
     * Update a permission
     */
    async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
        this.logger.log(`Updating permission: ${id}`, 'PermissionsService');

        // Check if permission exists
        const existingPermission = await this.prisma.permission.findUnique({
            where: { id },
        });

        if (!existingPermission) {
            this.logger.warn(`Permission update failed: not found → ${id}`, 'PermissionsService');
            throw new NotFoundException('Permission not found');
        }

        // Check if new name conflicts with existing permission
        if (updatePermissionDto.name && updatePermissionDto.name !== existingPermission.name) {
            const nameConflict = await this.prisma.permission.findFirst({
                where: {
                    name: updatePermissionDto.name,
                    id: { not: id },
                },
            });

            if (nameConflict) {
                this.logger.warn(`Permission update failed: name conflict → ${updatePermissionDto.name}`, 'PermissionsService');
                throw new ConflictException('Permission with this name already exists');
            }
        }

        const updatedPermission = await this.prisma.permission.update({
            where: { id },
            data: {
                ...(updatePermissionDto.name && { name: updatePermissionDto.name }),
                ...(updatePermissionDto.description && { description: updatePermissionDto.description }),
                ...(updatePermissionDto.category && { category: updatePermissionDto.category }),
            },
        });

        this.logger.log(`Permission updated: ${updatedPermission.name}`, 'PermissionsService');

        return {
            id: updatedPermission.id,
            name: updatedPermission.name,
            description: updatedPermission.description,
            category: updatedPermission.category,
            createdAt: updatedPermission.createdAt,
        };
    }

    /**
     * Get all permission categories
     */
    async getCategories(): Promise<CategoriesResponseDto> {
        this.logger.log('Retrieving permission categories', 'PermissionsService');

        const categories = [...STATIC_PERMISSION_CATEGORIES].sort((a, b) => a.localeCompare(b));

        this.logger.log(`Retrieved ${categories.length} permission categories`, 'PermissionsService');

        return {
            categories,
            total: categories.length,
        };
    }

    /**
     * Delete a permission
     */
    async remove(id: string): Promise<{ message: string }> {
        this.logger.log(`Deleting permission: ${id}`, 'PermissionsService');

        // Check if permission exists
        const permission = await this.prisma.permission.findUnique({
            where: { id },
            include: {
                rolePermissions: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!permission) {
            this.logger.warn(`Permission deletion failed: not found → ${id}`, 'PermissionsService');
            throw new NotFoundException('Permission not found');
        }

        // Check if permission is assigned to any roles
        if (permission.rolePermissions.length > 0) {
            const roleNames = permission.rolePermissions.map(rp => rp.role.name).join(', ');
            this.logger.warn(`Permission deletion failed: assigned to roles → ${id}`, 'PermissionsService');
            throw new ConflictException(`Cannot delete permission. It is assigned to the following roles: ${roleNames}`);
        }

        // Delete the permission
        await this.prisma.permission.delete({
            where: { id },
        });

        this.logger.log(`Permission deleted: ${permission.name}`, 'PermissionsService');

        return {
            message: `Permission '${permission.name}' has been deleted successfully`,
        };
    }
} 