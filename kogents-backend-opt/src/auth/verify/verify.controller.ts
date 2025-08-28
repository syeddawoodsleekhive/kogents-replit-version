import {
    Controller,
    Post,
    Body,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    Res,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiTooManyRequestsResponse,
    ApiCreatedResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { VerifyService } from './verify.service';
import { AppLoggerService } from 'src/common/logger/app-logger.service';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from '../auth.service';
import { Request, Response } from 'express';
import { ConfirmOtpDto, SendOtpForSignupSessionDto, ConfirmOtpForSignupSessionDto, RequestPasswordResetDto, ConfirmPasswordResetDto } from './dtos';
import {
    ApiValidationError,
    ApiNotFoundError,
    ApiInternalServerError
} from '../../common/decorators/api-error-response.decorator';

@ApiTags('Email Verification')
@Controller('auth/verify')
@UseGuards(ThrottlerGuard)
export class VerifyController {
    constructor(
        private readonly verifyService: VerifyService,
        private readonly authService: AuthService,
        private readonly logger: AppLoggerService
    ) { }

    @Public()
    @Post('send-otp')
    @Throttle({ verification: { limit: 3, ttl: 5 * 60 * 1000 } }) // 3 per 5 minutes
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Send OTP for admin signup (Step 3)',
        description: 'Send verification code for pending admin signup. Used in the admin registration flow after workspace creation.'
    })
    @ApiBody({
        type: SendOtpForSignupSessionDto,
        description: 'Session ID for OTP request'
    })
    @ApiOkResponse({
        description: 'Verification code sent successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Verification code sent to your email' },
                email: { type: 'string' },
                step: { type: 'string' }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Invalid session ID or signup not found'
    })
    @ApiTooManyRequestsResponse({
        description: 'Too many verification requests'
    })
    @ApiValidationError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async sendVerificationCodeForSignup(@Body() dto: SendOtpForSignupSessionDto) {
        this.logger.log(`Admin signup verification code requested for session: ${dto.sessionId}`, 'VerifyController');

        // Call service with session ID
        return this.verifyService.sendVerificationCodeForSignup(dto.sessionId);
    }

    @Public()
    @Post('confirm-otp')
    @Throttle({ verification: { limit: 5, ttl: 5 * 60 * 1000 } }) // 5 per 5 minutes
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Complete admin registration with OTP verification (Step 4)',
        description: 'Verify OTP code and complete the admin registration process. This atomically creates the admin user, workspace, and assigns permissions in the database.'
    })
    @ApiBody({
        type: ConfirmOtpForSignupSessionDto,
        description: 'Session ID and OTP code for verification'
    })
    @ApiCreatedResponse({
        description: 'Admin registration completed successfully',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', description: 'JWT access token' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        workspaceId: { type: 'string' }
                    }
                },
                workspace: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        apiToken: { type: 'string' }
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Invalid session ID, OTP code, or signup expired'
    })
    @ApiTooManyRequestsResponse({
        description: 'Too many verification attempts'
    })
    @ApiValidationError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async confirmVerificationCodeForSignup(
        @Body() dto: ConfirmOtpForSignupSessionDto,
        @Res() res: Response
    ) {
        this.logger.log(`Admin signup OTP confirmation attempted for session: ${dto.sessionId}`, 'VerifyController');

        // Verify OTP and commit to database in one call
        const confirmOtpDto: ConfirmOtpDto = {
            code: dto.code
        };
        const result = await this.verifyService.confirmVerificationCodeForSignup(dto.sessionId, confirmOtpDto);

        // If verification successful, commit to database
        if (result.readyForCommit) {
            const authResult = await this.authService.commitPendingUserToDatabase(dto.sessionId);

            // Set auth cookies using helper method
            this.setAuthCookies(res, authResult.refresh_token, authResult.user.id);

            // Log cookie setting for debugging
            this.logger.log(`Setting cookies for user ${authResult.user.id}: refreshToken=${authResult.refresh_token.substring(0, 20)}..., userId=${authResult.user.id}`, 'VerifyController');

            return res.status(HttpStatus.CREATED).json({
                access_token: authResult.access_token,
                user: authResult.user,
                workspace: authResult.workspace
            });
        } else {
            return res.status(HttpStatus.OK).json(result);
        }
    }

    /**
     * Helper method to set auth cookies consistently
     */
    private setAuthCookies(res: Response, token: string, userId: string) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.cookie('userId', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    @Public()
    @Post('request-password-reset')
    @Throttle({ password_reset: { limit: 3, ttl: 24 * 60 * 60 * 1000 } }) // 3 per 24 hours
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Request password reset',
        description: 'Send password reset link to user email. Rate limited to prevent abuse.'
    })
    @ApiBody({
        type: RequestPasswordResetDto,
        description: 'Email address for password reset'
    })
    @ApiOkResponse({
        description: 'Password reset link sent successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'If an account with this email exists, a password reset link has been sent.' },
                email: { type: 'string' }
            }
        }
    })
    @ApiTooManyRequestsResponse({
        description: 'Too many password reset requests'
    })
    @ApiValidationError()
    @ApiInternalServerError()
    async requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() req: Request) {
        const ip = req.ip || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        this.logger.log(`Password reset requested: ${dto.email}, ip: ${ip}`, 'VerifyController');

        return this.verifyService.sendPasswordResetLink(dto, ip, userAgent);
    }

    @Public()
    @Post('confirm-password-reset')
    @Throttle({ password_reset: { limit: 5, ttl: 24 * 60 * 60 * 1000 } }) // 5 per 24 hours
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Confirm password reset',
        description: 'Verify reset token and update user password. Invalidates all user sessions for security.'
    })
    @ApiBody({
        type: ConfirmPasswordResetDto,
        description: 'Reset token and new password (email is retrieved from token)'
    })
    @ApiOkResponse({
        description: 'Password reset completed successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Password has been reset successfully. Please log in with your new password.' },
                email: { type: 'string' }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Invalid reset token, expired token, or invalid password'
    })
    @ApiTooManyRequestsResponse({
        description: 'Too many password reset attempts'
    })
    @ApiValidationError()
    @ApiInternalServerError()
    async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto, @Req() req: Request) {
        const ip = req.ip || 'unknown';

        this.logger.log(`Password reset confirmation attempted with token: ${dto.token.substring(0, 20)}..., ip: ${ip}`, 'VerifyController');

        return this.verifyService.confirmPasswordReset(dto, ip);
    }
}
