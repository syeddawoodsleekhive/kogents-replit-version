import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: AppLoggerService) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const status = this.getHttpStatus(exception);
        const responseMessage = this.getResponseMessage(exception);
        const errorDetails = this.getErrorDetails(exception);
        const sanitizedError = this.sanitizeError(exception);

        // Enhanced logging with security context
        this.logError(exception, request, status, errorDetails);

        // Secure response - never expose internal details in production
        const secureResponse = {
            statusCode: status,
            message: responseMessage,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(process.env.NODE_ENV === 'development' && {
                details: sanitizedError,
                stack: exception instanceof Error ? exception.stack : undefined
            }),
        };

        response.status(status).json(secureResponse);
    }

    private getHttpStatus(exception: unknown): number {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        // Handle specific error types with security considerations
        if (exception instanceof Error) {
            const errorName = exception.constructor.name;
            switch (errorName) {
                case 'ValidationError':
                case 'TypeError':
                    return HttpStatus.BAD_REQUEST;
                case 'UnauthorizedError':
                case 'JsonWebTokenError':
                case 'TokenExpiredError':
                    return HttpStatus.UNAUTHORIZED;
                case 'ForbiddenError':
                    return HttpStatus.FORBIDDEN;
                case 'NotFoundError':
                    return HttpStatus.NOT_FOUND;
                case 'ConflictError':
                    return HttpStatus.CONFLICT;
                case 'TooManyRequestsError':
                    return HttpStatus.TOO_MANY_REQUESTS;
                default:
                    return HttpStatus.INTERNAL_SERVER_ERROR;
            }
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private getResponseMessage(exception: unknown): string {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'object' && response !== null && 'message' in response) {
                const message = (response as any).message;
                return Array.isArray(message) ? message[0] : String(message);
            }
            return exception.message;
        }

        if (exception instanceof Error) {
            // Sanitize error messages to prevent information leakage
            const sanitizedMessage = this.sanitizeErrorMessage(exception.message);
            return sanitizedMessage;
        }

        return 'Internal server error';
    }

    private sanitizeErrorMessage(message: string): string {
        // Remove sensitive information from error messages
        const sensitivePatterns = [
            /password/gi,
            /token/gi,
            /key/gi,
            /secret/gi,
            /credentials/gi,
            /authorization/gi,
        ];

        let sanitized = message;
        sensitivePatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
        });

        // Remove potential SQL injection patterns
        sanitized = sanitized.replace(/['";]/g, '');

        return sanitized;
    }

    private getErrorDetails(exception: unknown): any {
        if (exception instanceof HttpException) {
            return {
                type: 'HttpException',
                status: exception.getStatus(),
                response: exception.getResponse(),
            };
        }

        if (exception instanceof Error) {
            return {
                type: exception.constructor.name,
                message: exception.message,
            };
        }

        return {
            type: 'Unknown',
            message: 'An unknown error occurred',
        };
    }

    private sanitizeError(exception: unknown): any {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            return {
                type: 'HttpException',
                status: exception.getStatus(),
                message: this.sanitizeErrorMessage(exception.message),
            };
        }

        if (exception instanceof Error) {
            return {
                type: exception.constructor.name,
                message: this.sanitizeErrorMessage(exception.message),
            };
        }

        return {
            type: 'Unknown',
            message: 'An error occurred',
        };
    }

    private logError(exception: unknown, request: Request, status: number, errorDetails: any) {
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'unknown';

        // Security context for logging
        const securityContext = {
            ip: ip || 'unknown',
            userAgent,
            method,
            url,
            timestamp: new Date().toISOString(),
            status,
            errorType: errorDetails.type,
        };

        // Log different levels based on error severity
        if (status >= 500) {
            this.logger.error(
                `Server Error: ${errorDetails.message}`,
                exception instanceof Error ? exception.stack : undefined,
                'GlobalExceptionFilter',
                exception instanceof Error ? exception : undefined,
                securityContext
            );
        } else if (status >= 400) {
            this.logger.warn(
                `Client Error: ${errorDetails.message}`,
                'GlobalExceptionFilter',
                errorDetails,
                securityContext
            );
        } else {
            this.logger.log(
                `Request processed with status ${status}`,
                'GlobalExceptionFilter',
                errorDetails,
                securityContext
            );
        }

        // Additional security logging for suspicious activity
        if (this.isSuspiciousActivity(request, exception)) {
            this.logger.warn(
                `Suspicious activity detected: ${errorDetails.message}`,
                'SecurityMonitor',
                {
                    errorDetails,
                    suspiciousHeaders: this.getSuspiciousHeaders(headers),
                },
                securityContext
            );
        }
    }

    private isSuspiciousActivity(request: Request, exception: unknown): boolean {
        const { method, url, headers } = request;

        // Check for common attack patterns
        const suspiciousPatterns = [
            /script/gi,
            /javascript/gi,
            /<.*>/gi,
            /union.*select/gi,
            /drop.*table/gi,
            /\.\.\/.*\.\./gi,
        ];

        const urlString = decodeURIComponent(url);
        const bodyString = JSON.stringify(request.body || {});

        return suspiciousPatterns.some(pattern =>
            pattern.test(urlString) || pattern.test(bodyString)
        );
    }

    private getSuspiciousHeaders(headers: any): any {
        const suspiciousHeaders: any = {};
        const suspiciousHeaderNames = [
            'x-forwarded-for',
            'x-real-ip',
            'x-originating-ip',
            'x-cluster-client-ip',
        ];

        suspiciousHeaderNames.forEach(name => {
            if (headers[name]) {
                suspiciousHeaders[name] = headers[name];
            }
        });

        return suspiciousHeaders;
    }
}  