import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
    Inject,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';
import { AppLoggerService } from 'src/common/logger/app-logger.service';
import { JwtPayload } from 'src/common/types/jwt-payload.interface';
import { SecureIdService } from '../common/services/secure-id.service';
import { SecureRedisCache } from '../common/services/secure-redis-cache.service';
import {
    PendingUserData,
    SignupResponse
} from '../common/types/pending-user.interface';
import { SignupStep } from './dtos/signup-session.dto';
import { WidgetService } from 'src/widget/widget.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly logger: AppLoggerService,
        private readonly secureIdService: SecureIdService,
        private readonly secureRedisCache: SecureRedisCache,
        private readonly widgetService: WidgetService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    /**
     * Redis-based signup that caches user data instead of saving to DB
     */
    async signup(dto: SignupDto): Promise<SignupResponse> {
        // Check if user already exists in database
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            this.logger.warn(`Signup blocked: user already exists → ${dto.email}`, 'AuthService');
            throw new ConflictException('User with this email already exists');
        }

        // Generate unique session ID for this signup attempt
        const sessionId = this.secureIdService.generateRefreshToken();
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const pendingUserData: PendingUserData = {
            name: dto.name,
            email: dto.email,
            hashedPassword,
            step: SignupStep.SIGNUP,
            createdAt: new Date(),
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            sessionId, // Add session ID to track this specific signup attempt
        };

        // Store with session ID as key, not email
        await this.secureRedisCache.setPendingUserBySession(sessionId, pendingUserData);

        this.logger.log(`User signup cached with session: ${sessionId} for email: ${dto.email}`, 'AuthService');

        return {
            step: SignupStep.SIGNUP,
            email: dto.email,
            sessionId, // Return session ID to frontend
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
    }

    /**
     * Atomic transaction to commit cached data to database after email verification
     */
    async commitPendingUserToDatabase(
        sessionId: string
    ): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
        workspace: any;
    }> {
        const pendingUser = await this.secureRedisCache.getPendingUserBySession(sessionId);

        if (!pendingUser) {
            throw new NotFoundException('Signup data not found or expired');
        }

        if (pendingUser.step !== SignupStep.PENDING_VERIFICATION) {
            throw new BadRequestException('Email verification not completed');
        }

        if (!pendingUser.workspace) {
            throw new BadRequestException('Workspace data not found');
        }

        // Start atomic transaction
        return await this.prisma.$transaction(async (tx) => {
            // 1. Create user first (without workspaceId and roleId)
            const user = await tx.user.create({
                data: {
                    name: pendingUser.name,
                    email: pendingUser.email,
                    password: pendingUser.hashedPassword,
                    phone: pendingUser.phone,
                    status: (pendingUser.status as any) || 'ACTIVE',
                    avatarUrl: pendingUser.avatarUrl,
                },
            });

            // 2. Create workspace with user as admin
            const apiToken = this.secureIdService.generateApiKey();
            const workspace = await tx.workspace.create({
                data: {
                    name: pendingUser.workspace!.name,
                    slug: pendingUser.workspace!.slug,
                    branding: pendingUser.workspace!.branding || {},
                    apiToken,
                    adminId: user.id, // Now we have a valid user ID
                },
            });

            // Create default widget for workspace
            await this.widgetService.createDefaultWidget(workspace.id, tx);

            // 3. Create default admin role for this workspace
            const adminRole = await tx.role.create({
                data: {
                    name: 'admin',
                    description: 'Full workspace control - default admin role',
                    workspaceId: workspace.id,
                    isSystem: true,
                    isActive: true,
                },
            });

            // 4. Handle admin permission - check if it exists, create if needed, and assign to admin role
            let adminPermission = await tx.permission.findUnique({
                where: { name: 'admin' },
            });

            // Create admin permission if it doesn't exist
            if (!adminPermission) {
                adminPermission = await tx.permission.create({
                    data: {
                        name: 'admin',
                        description: 'Full administrative access to workspace',
                        category: 'admin',
                        isActive: true,
                    },
                });
                this.logger.log('Created admin permission', 'AuthService');
            }

            // Assign admin permission to admin role
            await tx.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: adminRole.id,
                        permissionId: adminPermission.id,
                    },
                },
                update: {}, // No updates needed if exists
                create: {
                    roleId: adminRole.id,
                    permissionId: adminPermission.id,
                },
            });

            // 5. Update user with workspaceId and admin role
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    workspaceId: workspace.id,
                    roleId: adminRole.id,
                },
                include: {
                    role: true,
                    workspace: true,
                },
            });

            // 6. Generate tokens using the updated user data
            const { access_token, refresh_token } = await this.generateTokens(user.id, updatedUser);

            // 7. Store refresh token in Redis
            await this.storeRefreshTokenInRedis(user.id, refresh_token);

            // 8. Clean up the pending user from cache
            await this.secureRedisCache.deletePendingUserBySession(sessionId);

            this.logger.log(`User committed to database: ${user.email} (Workspace: ${workspace.name})`, 'AuthService');

            return {
                access_token,
                refresh_token,
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    workspaceId: workspace.id,
                },
                workspace: {
                    id: workspace.id,
                    name: workspace.name,
                    slug: workspace.slug,
                    apiToken,
                },
            };
        });
    }

    /**
     * Resume signup
     */
    async resumeSignup(sessionId: string): Promise<{
        step: SignupStep;
        user: { name: string; email: string };
        workspace?: { name: string; slug: string };
        timeRemaining: number;
    }> {
        const pendingUser = await this.secureRedisCache.getPendingUserBySession(sessionId);

        if (!pendingUser) {
            throw new NotFoundException('Signup data not found or expired');
        }

        const timeRemaining = pendingUser.expiresAt.getTime() - Date.now();

        return {
            step: pendingUser.step,
            user: {
                name: pendingUser.name,
                email: pendingUser.email,
            },
            workspace: pendingUser.workspace ? {
                name: pendingUser.workspace.name,
                slug: pendingUser.workspace.slug,
            } : undefined,
            timeRemaining: Math.max(0, timeRemaining),
        };
    }

    /**
     * Login user
     */
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                workspace: true,
                role: true,
            },
        });

        if (!user) {
            this.logger.warn(`Login failed: user not found → ${dto.email}`, 'AuthService');
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            this.logger.warn(`Login failed: invalid password → ${dto.email}`, 'AuthService');
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.status !== 'ACTIVE') {
            this.logger.warn(`Login failed: user not active → ${dto.email}`, 'AuthService');
            throw new UnauthorizedException('Account is not active');
        }

        // Generate tokens
        const { access_token, refresh_token } = await this.generateTokens(user.id, user);

        // Store refresh token in Redis
        await this.storeRefreshTokenInRedis(user.id, refresh_token);

        this.logger.log(`User logged in: ${user.email}`, 'AuthService');

        return {
            access_token,
            refresh_token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                workspaceId: user.workspaceId
            },
            workspace: user.workspace ? {
                id: user.workspace.id,
                name: user.workspace.name,
                slug: user.workspace.slug,
            } : null,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshTokens(userId: string, refreshToken: string) {
        // Verify the refresh token is valid
        const storedRefreshToken = await this.redis.get(`refresh_token:${userId}`);

        if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Generate new tokens
        const { access_token, refresh_token } = await this.generateTokens(userId);

        // Store new refresh token in Redis
        await this.storeRefreshTokenInRedis(userId, refresh_token);

        this.logger.log(`Tokens refreshed for user: ${userId}`, 'AuthService');

        return {
            access_token,
            refresh_token,
        };
    }

    /**
     * Generate JWT access token and refresh token
     */
    private async generateTokens(userId: string, userData?: any) {
        let user = userData;

        // If userData is not provided, fetch from database
        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role: true,
                    workspace: true,
                },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }
        }

        const payload: JwtPayload = {
            userId: userId,
            email: user.email,
            role: user.role?.name || undefined,
            workspaceId: user.workspaceId || undefined,
        };

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                expiresIn: this.configService.get<string>('jwt.refreshTokenTtl'),
            }),
        ]);

        return { access_token, refresh_token };
    }

    private async storeRefreshTokenInRedis(userId: string, token: string) {
        const ttl = this.configService.get<number>('jwt.refreshTokenTtlSeconds', 7 * 24 * 60 * 60); // 7 days
        await this.redis.setex(`refresh_token:${userId}`, ttl, token);
    }
}