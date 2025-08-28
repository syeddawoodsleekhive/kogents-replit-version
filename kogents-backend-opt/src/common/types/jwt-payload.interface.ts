export interface JwtPayload {
    userId: string;
    email?: string;
    role?: string;
    workspaceId?: string;
}  