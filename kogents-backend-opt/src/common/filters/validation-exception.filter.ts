import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';
import { ErrorResponseUtil, ValidationError as CustomValidationError } from '../utils/error-response.util';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: AppLoggerService) { }

    catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse() as any;

        // Check if this is a validation error
        if (this.isValidationError(exceptionResponse)) {
            const validationErrors = this.formatValidationErrors(exceptionResponse.message);

            // Log validation errors with context
            this.logValidationErrors(request, validationErrors);

            // Return structured validation error response
            const errorResponse = ErrorResponseUtil.createValidationError(
                validationErrors,
                request.url
            );

            return response.status(status).json(errorResponse);
        }

        // For non-validation BadRequestExceptions, pass to global filter
        throw exception;
    }

    private isValidationError(exceptionResponse: any): boolean {
        return (
            Array.isArray(exceptionResponse.message) &&
            exceptionResponse.message.length > 0 &&
            typeof exceptionResponse.message[0] === 'object' &&
            'property' in exceptionResponse.message[0]
        );
    }

    private formatValidationErrors(messages: any[]): CustomValidationError[] {
        return messages.map((error: any) => ({
            field: error.property,
            value: error.value,
            message: error.constraints ? String(Object.values(error.constraints)[0]) : 'Invalid value',
            code: this.getValidationErrorCode(error),
        }));
    }

    private getValidationErrorCode(error: any): string {
        if (!error.constraints) return 'INVALID_VALUE';

        const constraintKeys = Object.keys(error.constraints);
        if (constraintKeys.length === 0) return 'INVALID_VALUE';

        const constraint = constraintKeys[0];

        // Map constraint types to error codes
        const constraintMap: { [key: string]: string } = {
            isNotEmpty: 'REQUIRED_FIELD',
            isEmail: 'INVALID_EMAIL',
            isString: 'INVALID_TYPE',
            isNumber: 'INVALID_TYPE',
            isEnum: 'INVALID_ENUM_VALUE',
            isUrl: 'INVALID_URL',
            minLength: 'MIN_LENGTH',
            maxLength: 'MAX_LENGTH',
            length: 'INVALID_LENGTH',
            matches: 'INVALID_FORMAT',
            min: 'MIN_VALUE',
            max: 'MAX_VALUE',
            isOptional: 'OPTIONAL_FIELD',
        };

        return constraintMap[constraint] || 'VALIDATION_ERROR';
    }

    private logValidationErrors(request: Request, validationErrors: CustomValidationError[]) {
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'unknown';

        const logContext = {
            method,
            url,
            ip: ip || 'unknown',
            userAgent,
            timestamp: new Date().toISOString(),
            validationErrors,
        };

        this.logger.warn(
            `Validation failed for ${method} ${url}`,
            'ValidationExceptionFilter',
            logContext
        );

        // Log individual validation errors for debugging
        validationErrors.forEach(error => {
            this.logger.debug(
                `Validation error: ${error.field} - ${error.message}`,
                'ValidationExceptionFilter',
                {
                    field: error.field,
                    value: error.value,
                    code: error.code,
                    message: error.message,
                }
            );
        });
    }
} 