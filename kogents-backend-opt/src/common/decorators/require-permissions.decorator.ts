import { SetMetadata } from '@nestjs/common';

export interface RequiredPermissions {
    canRead?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (permissions: RequiredPermissions) =>
    SetMetadata(PERMISSIONS_KEY, permissions); 