import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export interface ApiErrorResponseOptions {
    status: number;
    description: string;
    example?: any;
}

export const ApiErrorResponse = (options: ApiErrorResponseOptions) => {
    const { status, description, example } = options;

    const defaultExamples = {
        400: {
            summary: 'Bad Request',
            value: {
                statusCode: 400,
                message: 'Validation failed',
                errors: [
                    {
                        field: 'email',
                        value: 'invalid-email',
                        message: 'Invalid email format',
                        code: 'INVALID_EMAIL',
                    },
                ],
                timestamp: '2024-01-15T10:30:00.000Z',
                path: '/auth/signup',
            },
        },
        401: {
            summary: 'Unauthorized',
            value: {
                statusCode: 401,
                message: 'Unauthorized',
                timestamp: '2024-01-15T10:30:00.000Z',
                path: '/auth/login',
            },
        },
        403: {
            summary: 'Forbidden',
            value: {
                statusCode: 403,
                message: 'Forbidden',
                timestamp: '2024-01-15T10:30:00.000Z',
                path: '/users',
            },
        },
        404: {
            summary: 'Not Found',
            value: {
                statusCode: 404,
                message: 'Resource not found',
                timestamp: '2024-01-15T10:30:00.000Z',
                path: '/users/123',
            },
        },
        409: {
            summary: 'Conflict',
            value: {
                statusCode: 409,
                message: 'User already exists',
                timestamp: '2024-01-15T10:30:00.000Z',
                path: '/auth/signup',
            },
        },
        500: {
            summary: 'Internal Server Error',
            value: {
                statusCode: 500,
                message: 'Internal server error',
                timestamp: '2024-01-15T10:30:00.000Z',
                path: '/auth/signup',
            },
        },
    };

    return applyDecorators(
        ApiResponse({
            status,
            description,
            content: {
                'application/json': {
                    example: example || defaultExamples[status]?.value || defaultExamples[500].value,
                },
            },
        })
    );
};

// Convenience decorators for common error responses
export const ApiValidationError = () =>
    ApiErrorResponse({
        status: 400,
        description: 'Validation failed - check the errors array for details',
    });

export const ApiBadRequestError = () =>
    ApiErrorResponse({
        status: 400,
        description: 'Bad request - invalid operation or data',
    });

export const ApiUnauthorizedError = () =>
    ApiErrorResponse({
        status: 401,
        description: 'Unauthorized - authentication required',
    });

export const ApiForbiddenError = () =>
    ApiErrorResponse({
        status: 403,
        description: 'Forbidden - insufficient permissions',
    });

export const ApiNotFoundError = () =>
    ApiErrorResponse({
        status: 404,
        description: 'Resource not found',
    });

export const ApiConflictError = () =>
    ApiErrorResponse({
        status: 409,
        description: 'Conflict - resource already exists or cannot be created',
    });

export const ApiInternalServerError = () =>
    ApiErrorResponse({
        status: 500,
        description: 'Internal server error',
    }); 