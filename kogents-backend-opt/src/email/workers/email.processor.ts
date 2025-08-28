import { Worker, Job } from 'bullmq';
import { Injectable, Inject, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppLoggerService } from '../../common/logger/app-logger.service';

export enum EmailJobType {
    SEND_VERIFICATION_CODE = 'send_verification_code',
    SEND_ADMIN_WELCOME_EMAIL = 'send_admin_welcome_email',
    SEND_PASSWORD_RESET = 'send_password_reset',
    SEND_WORKSPACE_INVITATION = 'send_workspace_invitation',
    SEND_NEW_CHAT_REQUEST = 'send_new_chat_request',
    SEND_CHAT_ASSIGNMENT = 'send_chat_assignment',
    SEND_CHAT_TRANSFER = 'send_chat_transfer',
    SEND_CHAT_SUMMARY = 'send_chat_summary',
}

interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

interface EmailData {
    to: string;
    code?: string;
    type?: string;
    name?: string;
    workspaceName?: string;
    resetLink?: string;
    invitationLink?: string;
    // Chat notification fields
    agentName?: string;
    roomId?: string;
    visitorId?: string;
    priority?: string;
    fromAgentName?: string;
    toAgentName?: string;
    reason?: string;
    duration?: number;
    messageCount?: number;
    rating?: number;
}

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
    replyTo?: string;
}

// Custom error types for better error handling
export class EmailRateLimitError extends Error {
    constructor(message = 'Email rate limit exceeded') {
        super(message);
        this.name = 'EmailRateLimitError';
    }
}

export class EmailTemplateError extends Error {
    constructor(template: string) {
        super(`Email template not found: ${template}`);
        this.name = 'EmailTemplateError';
    }
}

export class EmailValidationError extends Error {
    constructor(field: string) {
        super(`Invalid email data: ${field}`);
        this.name = 'EmailValidationError';
    }
}

const RETRY_CONFIG = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
};

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger: AppLoggerService;

    constructor(
        private config: EmailConfig,
        @Inject(AppLoggerService) logger: AppLoggerService
    ) {
        this.logger = logger;
        this.initializeTransporter();
    }

    private initializeTransporter(): void {
        try {
            // Determine secure setting based on port
            const isSecurePort = this.config.port === 465;
            const useSecure = this.config.secure || isSecurePort;

            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: useSecure,
                auth: {
                    user: this.config.auth.user,
                    pass: this.config.auth.pass,
                },
                pool: true, // Use pooled connections
                maxConnections: 5, // Maximum number of connections
                maxMessages: 100, // Maximum number of messages per connection
                rateLimit: 14, // Maximum number of messages per second
                rateDelta: 1000, // Minimum time between messages
                // Improved security settings
                tls: {
                    rejectUnauthorized: process.env.NODE_ENV === 'production', // Only reject in production
                    minVersion: 'TLSv1.2', // Enforce minimum TLS version
                },
                // For port 587 (STARTTLS)
                ...(this.config.port === 587 && {
                    secure: false,
                    requireTLS: true,
                    ignoreTLS: false,
                }),
            });

            // Verify connection configuration
            this.transporter.verify((error) => {
                if (error) {
                    this.logger.error('Email transporter verification failed', error.stack, 'EmailService');
                } else {
                    this.logger.log('Email transporter verified successfully', 'EmailService');
                }
            });
        } catch (error) {
            this.logger.error('Failed to initialize email transporter', error.stack, 'EmailService');
            throw error;
        }
    }

    private validateEmailData(data: EmailData, jobType: EmailJobType): void {
        if (!data.to || !this.isValidEmail(data.to)) {
            throw new EmailValidationError('Invalid email address');
        }

        switch (jobType) {
            case EmailJobType.SEND_VERIFICATION_CODE:
                if (!data.code || !/^\d{6}$/.test(data.code)) {
                    throw new EmailValidationError('Invalid verification code');
                }
                break;
            case EmailJobType.SEND_PASSWORD_RESET:
                if (!data.resetLink || !this.isValidUrl(data.resetLink)) {
                    throw new EmailValidationError('Invalid reset link');
                }
                break;
            case EmailJobType.SEND_WORKSPACE_INVITATION:
                if (!data.invitationLink || !this.isValidUrl(data.invitationLink)) {
                    throw new EmailValidationError('Invalid invitation link');
                }
                break;
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private async loadEmailTemplate(templateName: string): Promise<EmailTemplate> {
        try {
            // TODO: In production, load templates from database or external files
            // This allows for hot-reloading templates without code deployment
            const templates: Record<string, EmailTemplate> = {
                verification_code: {
                    subject: 'Your Verification Code - Kogents',
                    html: this.getVerificationCodeTemplate(),
                    text: this.getVerificationCodeTextTemplate()
                },
                workspace_invitation: {
                    subject: 'You\'re Invited to Join {{workspaceName}}',
                    html: this.getWorkspaceInvitationTemplate(),
                    text: this.getWorkspaceInvitationTextTemplate()
                },
                password_reset: {
                    subject: 'Password Reset Request',
                    html: this.getPasswordResetTemplate(),
                    text: this.getPasswordResetTextTemplate()
                },
                'new-chat-request': {
                    subject: 'New Chat Request - {{priority}} Priority',
                    html: this.getNewChatRequestTemplate(),
                    text: this.getNewChatRequestTextTemplate()
                },
                'chat-assignment': {
                    subject: 'Chat Assignment Confirmed',
                    html: this.getChatAssignmentTemplate(),
                    text: this.getChatAssignmentTextTemplate()
                },
                'chat-transfer-received': {
                    subject: 'Chat Transfer - New Assignment',
                    html: this.getChatTransferReceivedTemplate(),
                    text: this.getChatTransferReceivedTextTemplate()
                },
                'chat-transfer-sent': {
                    subject: 'Chat Transfer - Confirmation',
                    html: this.getChatTransferSentTemplate(),
                    text: this.getChatTransferSentTextTemplate()
                },
                'chat-summary': {
                    subject: 'Chat Session Summary',
                    html: this.getChatSummaryTemplate(),
                    text: this.getChatSummaryTextTemplate()
                }
            };

            const template = templates[templateName];
            if (!template) {
                throw new EmailTemplateError(templateName);
            }

            return template;
        } catch (error) {
            if (error instanceof EmailTemplateError) {
                throw error;
            }
            this.logger.error(`Failed to load email template ${templateName}`, error.stack, 'EmailService');
            throw new EmailTemplateError(templateName);
        }
    }

    // Extracted template methods for better maintainability
    private getVerificationCodeTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin-bottom: 10px;">Verification Code</h1>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #333;">Hello {{name}},</p>
                    <p style="margin: 0 0 15px 0; color: #333;">Your verification code is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; font-family: monospace;">{{code}}</span>
                    </div>
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                    <p style="margin: 0; color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
                <div style="text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 Kogents. All rights reserved.</p>
                </div>
            </div>
        `;
    }

    private getVerificationCodeTextTemplate(): string {
        return `
            Verification Code
            
            Hello {{name}},
            
            Your verification code is: {{code}}
            
            This code will expire in 10 minutes.
            
            If you didn't request this code, please ignore this email.
            
            © 2024 Kogents. All rights reserved.
        `;
    }

    private getWorkspaceInvitationTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Workspace Invitation</h2>
                <p>Hello {{name}},</p>
                <p>You've been invited to join <strong>{{workspaceName}}</strong>.</p>
                <p>Click the link below to accept the invitation:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{invitationLink}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
                </div>
                <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
            </div>
        `;
    }

    private getWorkspaceInvitationTextTemplate(): string {
        return `
            Workspace Invitation
            
            Hello {{name}},
            
            You've been invited to join {{workspaceName}}.
            
            Click the link below to accept the invitation:
            {{invitationLink}}
            
            This invitation will expire in 7 days.
        `;
    }

    private getPasswordResetTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Password Reset</h2>
                <p>Hello {{name}},</p>
                <p>You requested a password reset for your account.</p>
                <p>Click the link below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{resetLink}}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this reset, please ignore this email.</p>
            </div>
        `;
    }

    private getPasswordResetTextTemplate(): string {
        return `
            Password Reset
            
            Hello {{name}},
            
            You requested a password reset for your account.
            
            Click the link below to reset your password:
            {{resetLink}}
            
            This link will expire in 1 hour.
            
            If you didn't request this reset, please ignore this email.
        `;
    }

    private replaceTemplateVariables(template: EmailTemplate, data: EmailData): EmailTemplate {
        const replaceInText = (text: string): string => {
            return text
                .replace(/\{\{code\}\}/g, data.code || '')
                .replace(/\{\{name\}\}/g, data.name || 'User')
                .replace(/\{\{workspaceName\}\}/g, data.workspaceName || 'Your Workspace')
                .replace(/\{\{resetLink\}\}/g, data.resetLink || '')
                .replace(/\{\{invitationLink\}\}/g, data.invitationLink || '')
                // Chat notification variables
                .replace(/\{\{agentName\}\}/g, data.agentName || 'Agent')
                .replace(/\{\{roomId\}\}/g, data.roomId || '')
                .replace(/\{\{visitorId\}\}/g, data.visitorId || '')
                .replace(/\{\{priority\}\}/g, data.priority || 'normal')
                .replace(/\{\{fromAgentName\}\}/g, data.fromAgentName || '')
                .replace(/\{\{toAgentName\}\}/g, data.toAgentName || '')
                .replace(/\{\{reason\}\}/g, data.reason || '')
                .replace(/\{\{duration\}\}/g, (data.duration || 0).toString())
                .replace(/\{\{messageCount\}\}/g, (data.messageCount || 0).toString())
                .replace(/\{\{rating\}\}/g, (data.rating || 0).toString());
        };

        return {
            subject: replaceInText(template.subject),
            html: replaceInText(template.html),
            text: replaceInText(template.text)
        };
    }

    async sendEmail(data: EmailData, jobType: EmailJobType): Promise<void> {
        try {
            // Validate input data
            this.validateEmailData(data, jobType);

            const templateName = this.getTemplateNameForJobType(jobType);
            const template = await this.loadEmailTemplate(templateName);
            const processedTemplate = this.replaceTemplateVariables(template, data);

            const mailOptions = {
                from: this.config.from,
                replyTo: this.config.replyTo || this.config.from,
                to: data.to,
                subject: processedTemplate.subject,
                html: processedTemplate.html,
                text: processedTemplate.text,
                headers: {
                    'X-Mailer': 'Kogents Email Service',
                    'X-Job-Type': jobType,
                    'X-Priority': '3', // Normal priority
                },
            };

            const result = await this.transporter.sendMail(mailOptions);

            this.logger.log(`Email sent successfully to ${data.to}`, 'EmailService', {
                messageId: result.messageId,
                jobType,
                recipient: data.to,
            });

            // Store email metrics (in production, send to monitoring service)
            this.storeEmailMetrics(jobType, data.to, true);

        } catch (error) {
            this.logger.error(`Failed to send email to ${data.to}`, error.stack, 'EmailService');

            // Store failure metrics
            this.storeEmailMetrics(jobType, data.to, false, error.message);

            throw error;
        }
    }

    private storeEmailMetrics(jobType: EmailJobType, recipient: string, success: boolean, error?: string): void {
        // In production, send metrics to monitoring service (e.g., DataDog, New Relic, etc.)
        const metrics = {
            timestamp: new Date().toISOString(),
            jobType,
            recipient: recipient.split('@')[1], // Only store domain for privacy
            success,
            error: error || null,
        };

        // For now, just log metrics
        this.logger.log('Email metrics', 'EmailService', metrics);
    }

    private getTemplateNameForJobType(jobType: EmailJobType): string {
        switch (jobType) {
            case EmailJobType.SEND_VERIFICATION_CODE:
                return 'verification_code';
            case EmailJobType.SEND_WORKSPACE_INVITATION:
                return 'workspace_invitation';
            case EmailJobType.SEND_PASSWORD_RESET:
                return 'password_reset';
            case EmailJobType.SEND_NEW_CHAT_REQUEST:
                return 'new-chat-request';
            case EmailJobType.SEND_CHAT_ASSIGNMENT:
                return 'chat-assignment';
            case EmailJobType.SEND_CHAT_TRANSFER:
                return 'chat-transfer-received'; // Default to received, will be overridden by context
            case EmailJobType.SEND_CHAT_SUMMARY:
                return 'chat-summary';
            default:
                throw new EmailTemplateError(`Unknown job type: ${jobType}`);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            this.logger.error('Email service health check failed', error.stack, 'EmailService');
            return false;
        }
    }

    // Chat notification templates
    private getNewChatRequestTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin-bottom: 10px;">New Chat Request</h1>
                    <div style="background: ${this.getPriorityColor('{{priority}}')}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold;">
                        {{priority}} Priority
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #333;">Hello {{agentName}},</p>
                    <p style="margin: 0 0 15px 0; color: #333;">A new chat request has been received in <strong>{{workspaceName}}</strong>.</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Room ID:</strong> {{roomId}}</p>
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Visitor ID:</strong> {{visitorId}}</p>
                        <p style="margin: 0; color: #333;"><strong>Priority:</strong> {{priority}}</p>
                    </div>
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Please respond to this chat request as soon as possible.</p>
                </div>
                <div style="text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 Kogents. All rights reserved.</p>
                </div>
            </div>
        `;
    }

    private getNewChatRequestTextTemplate(): string {
        return `
            New Chat Request
            
            Hello {{agentName}},
            
            A new chat request has been received in {{workspaceName}}.
            
            Room ID: {{roomId}}
            Visitor ID: {{visitorId}}
            Priority: {{priority}}
            
            Please respond to this chat request as soon as possible.
            
            © 2024 Kogents. All rights reserved.
        `;
    }

    private getChatAssignmentTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin-bottom: 10px;">Chat Assignment Confirmed</h1>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #333;">Hello {{agentName}},</p>
                    <p style="margin: 0 0 15px 0; color: #333;">You have been assigned to a new chat session.</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0; color: #333;"><strong>Room ID:</strong> {{roomId}}</p>
                    </div>
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Please start the conversation with the visitor.</p>
                </div>
                <div style="text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 Kogents. All rights reserved.</p>
                </div>
            </div>
        `;
    }

    private getChatAssignmentTextTemplate(): string {
        return `
            Chat Assignment Confirmed
            
            Hello {{agentName}},
            
            You have been assigned to a new chat session.
            
            Room ID: {{roomId}}
            
            Please start the conversation with the visitor.
            
            © 2024 Kogents. All rights reserved.
        `;
    }

    private getChatTransferReceivedTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin-bottom: 10px;">Chat Transfer - New Assignment</h1>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #333;">Hello {{agentName}},</p>
                    <p style="margin: 0 0 15px 0; color: #333;">A chat has been transferred to you from <strong>{{fromAgentName}}</strong>.</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Room ID:</strong> {{roomId}}</p>
                        <p style="margin: 0; color: #333;"><strong>Reason:</strong> {{reason}}</p>
                    </div>
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Please continue the conversation with the visitor.</p>
                </div>
                <div style="text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 Kogents. All rights reserved.</p>
                </div>
            </div>
        `;
    }

    private getChatTransferReceivedTextTemplate(): string {
        return `
            Chat Transfer - New Assignment
            
            Hello {{agentName}},
            
            A chat has been transferred to you from {{fromAgentName}}.
            
            Room ID: {{roomId}}
            Reason: {{reason}}
            
            Please continue the conversation with the visitor.
            
            © 2024 Kogents. All rights reserved.
        `;
    }

    private getChatTransferSentTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin-bottom: 10px;">Chat Transfer - Confirmation</h1>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #333;">Hello {{agentName}},</p>
                    <p style="margin: 0 0 15px 0; color: #333;">You have transferred a chat to <strong>{{toAgentName}}</strong>.</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Room ID:</strong> {{roomId}}</p>
                        <p style="margin: 0; color: #333;"><strong>Reason:</strong> {{reason}}</p>
                    </div>
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">The chat has been successfully transferred.</p>
                </div>
                <div style="text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 Kogents. All rights reserved.</p>
                </div>
            </div>
        `;
    }

    private getChatTransferSentTextTemplate(): string {
        return `
            Chat Transfer - Confirmation
            
            Hello {{agentName}},
            
            You have transferred a chat to {{toAgentName}}.
            
            Room ID: {{roomId}}
            Reason: {{reason}}
            
            The chat has been successfully transferred.
            
            © 2024 Kogents. All rights reserved.
        `;
    }

    private getChatSummaryTemplate(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin-bottom: 10px;">Chat Session Summary</h1>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #333;">Hello {{agentName}},</p>
                    <p style="margin: 0 0 15px 0; color: #333;">Here's a summary of your recent chat session:</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Room ID:</strong> {{roomId}}</p>
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Visitor ID:</strong> {{visitorId}}</p>
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Duration:</strong> {{duration}} seconds</p>
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Messages:</strong> {{messageCount}}</p>
                        <p style="margin: 0 0 10px 0; color: #333;"><strong>Rating:</strong> <span style="color: #ffc107;">★★★★★</span> {{rating}}/5</p>
                    </div>
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Thank you for providing excellent customer service!</p>
                </div>
                <div style="text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 Kogents. All rights reserved.</p>
                </div>
            </div>
        `;
    }

    private getChatSummaryTextTemplate(): string {
        return `
            Chat Session Summary
            
            Hello {{agentName}},
            
            Here's a summary of your recent chat session:
            
            Room ID: {{roomId}}
            Visitor ID: {{visitorId}}
            Duration: {{duration}} seconds
            Messages: {{messageCount}}
            Rating: {{rating}}/5
            
            Thank you for providing excellent customer service!
            
            © 2024 Kogents. All rights reserved.
        `;
    }

    private getPriorityColor(priority: string): string {
        switch (priority.toLowerCase()) {
            case 'urgent': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'normal': return '#28a745';
            case 'low': return '#6c757d';
            default: return '#28a745';
        }
    }
}

// Simplified worker factory - receives dependencies instead of creating them
export const createEmailWorker = (
    redisConnection: any,
    emailService: EmailService,
    logger: AppLoggerService
) => {
    const worker = new Worker(
        'email_notifications',
        async (job: Job) => {
            const { to, code, type, name, workspaceName, resetLink, invitationLink } = job.data;
            const jobType = job.name as EmailJobType;

            logger.log(`Processing email job: ${jobType} to ${to}`, 'EmailWorker');

            try {
                await emailService.sendEmail(
                    { to, code, type, name, workspaceName, resetLink, invitationLink },
                    jobType
                );

                logger.log(`Email job completed successfully: ${jobType} to ${to}`, 'EmailWorker');
            } catch (error) {
                logger.error(`Email job failed: ${jobType} to ${to}`, error.stack, 'EmailWorker');
                throw error; // Re-throw to trigger retry mechanism
            }
        },
        {
            connection: redisConnection,
            ...RETRY_CONFIG,
        }
    );

    // Worker event handlers
    worker.on('completed', (job) => {
        logger.log(`Email job completed: ${job.name} to ${job.data.to}`, 'EmailWorker');
    });

    worker.on('failed', (job, err) => {
        logger.error(`Email job failed: ${job?.name} to ${job?.data.to}`, err.stack, 'EmailWorker');
    });

    worker.on('error', (err) => {
        logger.error('Email worker error', err.stack, 'EmailWorker');
    });

    // Health check interval
    setInterval(async () => {
        const isHealthy = await emailService.healthCheck();
        if (!isHealthy) {
            logger.warn('Email service health check failed', 'EmailWorker');
        }
    }, 300000); // Every 5 minutes

    logger.log('Email worker started successfully', 'EmailWorker');
    return worker;
};