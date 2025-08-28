import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY, RequiredPermissions } from '../decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../types/auth-request.interface';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermissions>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no permissions are required, allow access
        if (!requiredPermissions) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const { user } = request;

        if (!user || !user.userId || !user.workspaceId) {
            this.logger.warn('Permissions check failed - user not authenticated or missing workspace', 'PermissionsGuard');
            throw new ForbiddenException('Authentication required');
        }

        // Get user with role and role permissions
        const userWithRole = await this.prisma.user.findUnique({
            where: { id: user.userId },
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
            }
        });

        if (!userWithRole?.role) {
            this.logger.warn(`No role found for user ${user.userId} in workspace ${user.workspaceId}`, 'PermissionsGuard');
            throw new ForbiddenException('No role assigned to user');
        }

        // Get user's permissions from role
        const userPermissions = userWithRole.role.rolePermissions.map(rp => rp.permission.name);

        // Admin short-circuit: admins can access everything
        if (userPermissions.includes('admin')) {
            this.logger.log(
                `Admin access granted for user ${user.userId} in workspace ${user.workspaceId}`,
                'PermissionsGuard'
            );
            return true;
        }

        // Derive resource from controller path metadata; fallback to controller class name
        const controller = context.getClass();
        const pathMeta = this.reflector.get<string>(PATH_METADATA as any, controller) || '';
        const derivedFromPath = (pathMeta || '').trim();
        const controllerName = controller?.name || '';
        const resourceRaw = controllerName.endsWith('Controller')
            ? controllerName.substring(0, controllerName.length - 'Controller'.length)
            : controllerName;
        const derivedFromClass = resourceRaw
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
        const pathPrimary = derivedFromPath
            .replace(/^\//, '')
            .split('/')
            .filter(Boolean)[0] || '';
        const baseResource = (pathPrimary || derivedFromClass) || '';

        // Support plural permission namespaces (e.g., 'users')
        const candidates: string[] = [];
        if (baseResource) {
            candidates.push(baseResource);
        }

        // Build the list of specific required permission strings for this resource
        const requiredPermissionStrings: string[] = [];
        const addForAllCandidates = (action: 'read' | 'create' | 'edit' | 'delete') => {
            for (const c of candidates) {
                requiredPermissionStrings.push(`${c}:${action}`);
            }
        };
        if (requiredPermissions.canRead) addForAllCandidates('read');
        if (requiredPermissions.canCreate) addForAllCandidates('create');
        if (requiredPermissions.canEdit) addForAllCandidates('edit');
        if (requiredPermissions.canDelete) addForAllCandidates('delete');

        // Compute missing permissions for the user
        const missingPermissionStrings = requiredPermissionStrings.filter(p => !userPermissions.includes(p));

        if (missingPermissionStrings.length > 0) {
            this.logger.warn(
                `Permission denied for user ${user.userId} in workspace ${user.workspaceId} on resource '${baseResource}'. Missing: ${missingPermissionStrings.join(', ')}`,
                'PermissionsGuard'
            );
            throw new ForbiddenException(`Insufficient permissions. Required: ${missingPermissionStrings.join(', ')}`);
        }

        this.logger.log(
            `Permission check passed for user ${user.userId} in workspace ${user.workspaceId} on resource '${baseResource}'`,
            'PermissionsGuard'
        );

        return true;
    }
} 