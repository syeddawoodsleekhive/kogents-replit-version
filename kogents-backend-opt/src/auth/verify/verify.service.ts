import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
} from '@nestjs/common';
import { VerificationType, ConfirmOtpDto, RequestPasswordResetDto, ConfirmPasswordResetDto } from './dtos';
import { Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from 'src/common/logger/app-logger.service';
import { SecureRedisCache } from '../../common/services/secure-redis-cache.service';
import { SecureIdService } from '../../common/services/secure-id.service';
import { PendingEmailVerification } from '../../common/types/pending-user.interface';
import { SignupStep } from '../dtos/signup-session.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VerifyService {
    constructor(
        @Inject('EMAIL_QUEUE') private readonly emailQueue: Queue,
        private readonly configService: ConfigService,
        private readonly logger: AppLoggerService,
        private readonly secureRedisCache: SecureRedisCache,
        private readonly secureIdService: SecureIdService,
        private readonly prisma: PrismaService,
    ) { }

    private get otpExpiryMinutes() {
        return this.configService.get<number>('verification.otpExpiryMinutes') ?? 10;
    }

    private get minResendIntervalMinutes() {
        return this.configService.get<number>('verification.minResendIntervalMinutes') ?? 2;
    }

    private get maxAttempts() {
        return this.configService.get<number>('verification.maxAttempts') ?? 5;
    }

    private readonly EMAIL_QUEUE_JOB_NAME = 'send_verification_code';
    private readonly PASSWORD_RESET_JOB_NAME = 'send_password_reset';

    private async sendOtpEmail(email: string, code: string, type: VerificationType) {
        await this.addEmailToQueue({
            to: email,
            code,
            type,
        });
    }

    private async sendPasswordResetEmail(email: string, resetLink: string, userName: string) {
        try {
            await this.emailQueue.add(this.PASSWORD_RESET_JOB_NAME, {
                to: email,
                resetLink,
                name: userName,
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
        } catch (error) {
            this.logger.error('Failed to add password reset email to queue', error.stack, 'VerifyService');
            throw new InternalServerErrorException('Failed to queue password reset email. Please try again.');
        }
    }

    private async addEmailToQueue(emailData: { to: string; code?: string; type: VerificationType; resetLink?: string; name?: string }) {
        try {
            await this.emailQueue.add(this.EMAIL_QUEUE_JOB_NAME, emailData, {
                attempts: 3, // Retry failed jobs up to 3 times
                backoff: {
                    type: 'exponential',
                    delay: 2000, // Start with 2 seconds delay
                },
            });
        } catch (error) {
            // Log the error for monitoring
            this.logger.error('Failed to add email to queue', error.stack, 'VerifyService');
            // Optionally, add to a dead-letter queue or notify admin here
            throw new InternalServerErrorException('Failed to queue email. Please try again.');
        }
    }

    /**
     * Send verification code for Redis-cached admin registration
     */
    async sendVerificationCodeForSignup(sessionId: string): Promise<{ message: string; email: string; step: SignupStep }> {
        const pendingUser = await this.secureRedisCache.getPendingUserBySession(sessionId);

        if (!pendingUser) {
            throw new NotFoundException('Signup data not found or expired');
        }

        const email = pendingUser.email;

        // Check if there's already a pending verification for this email
        const existingVerification = await this.secureRedisCache.getEmailVerification(email);

        if (existingVerification) {
            // Check rate limit
            const timeSinceLastSent = Date.now() - existingVerification.lastSentAt.getTime();
            const minResendInterval = this.minResendIntervalMinutes * 60 * 1000; // Convert to milliseconds

            if (timeSinceLastSent < minResendInterval) {
                throw new ConflictException(`Please wait ${this.minResendIntervalMinutes} minutes before requesting another code`);
            }
        }

        // Generate new OTP
        const otpCode = this.secureIdService.generateOtpCode();
        const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

        const emailVerification: PendingEmailVerification = {
            otpCode,
            verificationType: VerificationType.workspace_creation,
            attempts: 0,
            lastSentAt: new Date(),
            expiresAt,
        };

        // Store verification data in Redis
        await this.secureRedisCache.setEmailVerification(email, emailVerification);

        // Update pending user step
        await this.secureRedisCache.updatePendingUserBySession(sessionId, {
            step: SignupStep.EMAIL_SENT,
            emailVerification
        });

        // Send email
        await this.sendOtpEmail(email, otpCode, VerificationType.workspace_creation);

        this.logger.log(`OTP sent to ${email}`, 'VerifyService');

        return {
            message: 'Verification code sent',
            email,
            step: SignupStep.EMAIL_SENT
        };
    }

    /**
     * Confirm verification code for Redis-cached admin registration
     */
    async confirmVerificationCodeForSignup(sessionId: string, dto: ConfirmOtpDto): Promise<{
        email: string;
        step: SignupStep;
        message: string;
        readyForCommit: boolean;
    }> {
        const pendingUser = await this.secureRedisCache.getPendingUserBySession(sessionId);

        if (!pendingUser) {
            throw new NotFoundException('Signup data not found or expired');
        }

        const email = pendingUser.email;
        const emailVerification = await this.secureRedisCache.getEmailVerification(email);

        if (!emailVerification) {
            throw new NotFoundException('No verification code found. Please request a new one.');
        }

        // Check if code has expired
        if (new Date() > emailVerification.expiresAt) {
            await this.secureRedisCache.deleteEmailVerification(email);
            throw new BadRequestException('Verification code has expired. Please request a new one.');
        }

        // Check if max attempts exceeded
        if (emailVerification.attempts >= this.maxAttempts) {
            await this.secureRedisCache.deleteEmailVerification(email);
            throw new BadRequestException('Maximum verification attempts exceeded. Please try later.');
        }

        // Verify the OTP code
        if (emailVerification.otpCode !== dto.code) {
            // Increment attempts
            emailVerification.attempts += 1;
            await this.secureRedisCache.setEmailVerification(email, emailVerification);

            const attemptsRemaining = this.maxAttempts - emailVerification.attempts;
            throw new BadRequestException(`Invalid verification code. ${attemptsRemaining} attempts remaining.`);
        }

        // Update pending user to verified status - this will be handled by AuthService
        await this.secureRedisCache.updatePendingUserBySession(sessionId, {
            step: SignupStep.PENDING_VERIFICATION
        });

        this.logger.log(`Email verified for ${email}. Ready for database commit.`, 'VerifyService');

        // Return signup info - the actual commit will be handled by the controller calling AuthService
        return {
            email,
            step: SignupStep.PENDING_VERIFICATION,
            message: 'Email verified successfully. Ready to commit to database.',
            readyForCommit: true
        };
    }

    /**
     * Send password reset link to user's email
     */
    async sendPasswordResetLink(dto: RequestPasswordResetDto, ipAddress: string, userAgent: string): Promise<{ message: string; email: string }> {
        const { email } = dto;

        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            this.logger.log(`Password reset requested for non-existent email: ${email}, ip: ${ipAddress}`, 'VerifyService');
            return {
                message: 'If an account with this email exists, a password reset link has been sent.',
                email: email
            };
        }

        // Check if there's already a pending verification for this email
        const existingVerification = await this.secureRedisCache.getEmailVerification(email);

        if (existingVerification && existingVerification.verificationType === VerificationType.password_reset) {
            // Check rate limit
            const timeSinceLastSent = Date.now() - existingVerification.lastSentAt.getTime();
            const minResendInterval = this.minResendIntervalMinutes * 60 * 1000;

            if (timeSinceLastSent < minResendInterval) {
                throw new ConflictException(`Please wait ${this.minResendIntervalMinutes} minutes before requesting another password reset link`);
            }
        }

        // Generate reset token
        const resetToken = this.secureIdService.generateRefreshToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

        const emailVerification: PendingEmailVerification = {
            otpCode: resetToken, // Reusing otpCode field for reset token
            verificationType: VerificationType.password_reset,
            attempts: 0,
            lastSentAt: new Date(),
            expiresAt,
        };

        // Store verification data in Redis with token as key for easy lookup
        await this.secureRedisCache.setEmailVerification(email, emailVerification);

        // Also store token-to-email mapping for easy lookup during confirmation
        await this.secureRedisCache.setPasswordResetToken(resetToken, email);

        // Generate reset link (token only - no email in URL)
        const dashboardUrl = this.configService.get<string>('dashboardUrl') || 'http://localhost:3000';
        const resetLink = `${dashboardUrl}/reset-password?token=${resetToken}`;

        // Send email with reset link
        await this.sendPasswordResetEmail(email, resetLink, user.name);

        this.logger.log(`Password reset link sent to ${email}, ip: ${ipAddress}`, 'VerifyService');

        return {
            message: 'If an account with this email exists, a password reset link has been sent.',
            email: email
        };
    }

    /**
     * Confirm password reset token and update password
     */
    async confirmPasswordReset(dto: ConfirmPasswordResetDto, ipAddress: string): Promise<{ message: string; email: string }> {
        const { token, newPassword } = dto;

        // Get the email associated with this token from Redis
        const email = await this.secureRedisCache.getPasswordResetEmail(token);

        if (!email) {
            throw new BadRequestException('Invalid or expired password reset token');
        }

        // Get the email verification from Redis using the email
        const emailVerification = await this.secureRedisCache.getEmailVerification(email);

        if (!emailVerification || emailVerification.verificationType !== VerificationType.password_reset) {
            throw new BadRequestException('Invalid or expired password reset token');
        }

        // Check if token has expired
        if (new Date() > emailVerification.expiresAt) {
            await this.secureRedisCache.deleteEmailVerification(email);
            await this.secureRedisCache.deletePasswordResetToken(token);
            throw new BadRequestException('Password reset token has expired. Please request a new one.');
        }

        // Check if max attempts exceeded
        if (emailVerification.attempts >= this.maxAttempts) {
            await this.secureRedisCache.deleteEmailVerification(email);
            await this.secureRedisCache.deletePasswordResetToken(token);
            throw new BadRequestException('Maximum verification attempts exceeded. Please try later.');
        }

        // Verify the reset token
        if (emailVerification.otpCode !== token) {
            // Increment attempts
            emailVerification.attempts += 1;
            await this.secureRedisCache.setEmailVerification(email, emailVerification);

            const attemptsRemaining = this.maxAttempts - emailVerification.attempts;
            throw new BadRequestException(`Invalid reset token. ${attemptsRemaining} attempts remaining.`);
        }

        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Clean up all verification data
        await this.secureRedisCache.deleteEmailVerification(email);
        await this.secureRedisCache.deletePasswordResetToken(token);

        this.logger.log(`Password reset completed for user ${user.id}, ip: ${ipAddress}`, 'VerifyService');

        return {
            message: 'Password has been reset successfully. Please log in with your new password.',
            email: email
        };
    }
}