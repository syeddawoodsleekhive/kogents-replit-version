export interface ValidationError {
    field: string;
    value?: any;
    message: string;
    code: string;
}

export interface ErrorResponse {
    statusCode: number;
    message: string;
    errors?: ValidationError[];
    timestamp: string;
    path: string;
    details?: any;
}

export class ErrorResponseUtil {
    static createValidationError(
        errors: ValidationError[],
        path: string,
        details?: any
    ): ErrorResponse {
        return {
            statusCode: 400,
            message: 'Validation failed',
            errors,
            timestamp: new Date().toISOString(),
            path,
            details,
        };
    }

    static createBadRequestError(
        message: string,
        path: string,
        details?: any
    ): ErrorResponse {
        return {
            statusCode: 400,
            message,
            timestamp: new Date().toISOString(),
            path,
            details,
        };
    }

    static createUnauthorizedError(
        message: string = 'Unauthorized',
        path: string,
        details?: any
    ): ErrorResponse {
        return {
            statusCode: 401,
            message,
            timestamp: new Date().toISOString(),
            path,
            details,
        };
    }

    static createForbiddenError(
        message: string = 'Forbidden',
        path: string,
        details?: any
    ): ErrorResponse {
        return {
            statusCode: 403,
            message,
            timestamp: new Date().toISOString(),
            path,
            details,
        };
    }

    static createNotFoundError(
        message: string = 'Resource not found',
        path: string,
        details?: any
    ): ErrorResponse {
        return {
            statusCode: 404,
            message,
            timestamp: new Date().toISOString(),
            path,
            details,
        };
    }

    static createConflictError(
        message: string = 'Conflict',
        path: string,
        details?: any
    ): ErrorResponse {
        return {
            statusCode: 409,
            message,
            timestamp: new Date().toISOString(),
            path,
            details,
        };
    }

    static createInternalServerError(
        message: string = 'Internal server error',
        path: string,
        details?: any
    ): ErrorResponse {
        return {
            statusCode: 500,
            message,
            timestamp: new Date().toISOString(),
            path,
            details,
        };
    }
} 