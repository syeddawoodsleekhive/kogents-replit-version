import { Injectable, LoggerService, Logger, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
    correlationId?: string;
    userId?: string;
    requestId?: string;
    workspaceId?: string;
    [key: string]: any;
}

export interface LogData {
    message: string;
    context?: string;
    data?: any;
    error?: Error;
    metadata?: LogContext;
}

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
    private readonly logger = new Logger('App');
    private readonly configService: ConfigService;
    private correlationId?: string;

    constructor(configService: ConfigService) {
        this.configService = configService;
    }

    setCorrelationId(correlationId: string): void {
        this.correlationId = correlationId;
    }

    private formatMessage(logData: LogData): string {
        const { message, context, data, error, metadata } = logData;

        let formattedMessage = message;

        if (context) {
            formattedMessage = `[${context}] ${formattedMessage}`;
        }

        return formattedMessage;
    }

    private createLogObject(logData: LogData, level: string): any {
        const { message, context, data, error, metadata } = logData;

        const logObject: any = {
            timestamp: new Date().toISOString(),
            level,
            message: this.formatMessage(logData),
            context: context || 'App',
        };

        // Add correlation ID if available
        if (this.correlationId) {
            logObject.correlationId = this.correlationId;
        }

        // Add metadata
        if (metadata) {
            Object.assign(logObject, metadata);
        }

        // Add data if provided
        if (data !== undefined) {
            logObject.data = data;
        }

        // Add error details if provided
        if (error) {
            logObject.error = {
                name: error.name,
                message: error.message,
                stack: this.configService.get('NODE_ENV') === 'development' ? error.stack : undefined,
            };
        }

        return logObject;
    }

    private shouldLog(level: string): boolean {
        const logLevel = this.configService.get('LOG_LEVEL', 'info').toLowerCase();
        const levels = ['error', 'warn', 'log', 'debug', 'verbose'];
        const currentLevelIndex = levels.indexOf(level);
        const configuredLevelIndex = levels.indexOf(logLevel);

        return currentLevelIndex <= configuredLevelIndex;
    }

    log(message: string, context?: string, data?: any, metadata?: LogContext): void {
        if (!this.shouldLog('log')) return;

        const logObject = this.createLogObject({ message, context, data, metadata }, 'info');
        this.logger.log(JSON.stringify(logObject));
    }

    error(message: any, trace?: string, context?: string, error?: Error, metadata?: LogContext): void {
        if (!this.shouldLog('error')) return;

        let errorMessage: string;
        let errorObj: Error | undefined;

        if (typeof message === 'string') {
            errorMessage = message;
        } else if (message instanceof Error) {
            errorMessage = message.message;
            errorObj = message;
        } else {
            errorMessage = JSON.stringify(message);
        }

        const logObject = this.createLogObject({
            message: errorMessage,
            context,
            error: errorObj || error,
            metadata
        }, 'error');

        if (trace) {
            logObject.trace = trace;
        }

        this.logger.error(JSON.stringify(logObject));
    }

    warn(message: string, context?: string, data?: any, metadata?: LogContext): void {
        if (!this.shouldLog('warn')) return;

        const logObject = this.createLogObject({ message, context, data, metadata }, 'warn');
        this.logger.warn(JSON.stringify(logObject));
    }

    debug(message: string, context?: string, data?: any, metadata?: LogContext): void {
        if (!this.shouldLog('debug')) return;

        const logObject = this.createLogObject({ message, context, data, metadata }, 'debug');
        this.logger.debug(JSON.stringify(logObject));
    }

    verbose(message: string, context?: string, data?: any, metadata?: LogContext): void {
        if (!this.shouldLog('verbose')) return;

        const logObject = this.createLogObject({ message, context, data, metadata }, 'verbose');
        this.logger.verbose(JSON.stringify(logObject));
    }

    // Enterprise-specific methods
    logRequest(req: any, context?: string): void {
        const metadata: LogContext = {
            userId: req.user?.userId,
            workspaceId: req.user?.workspaceId,
            requestId: req.headers['x-request-id'],
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.url,
        };

        this.log(`Request: ${req.method} ${req.url}`, context, undefined, metadata);
    }

    logResponse(res: any, context?: string, duration?: number): void {
        const metadata: LogContext = {
            statusCode: res.statusCode,
            duration: duration ? `${duration}ms` : undefined,
        };

        this.log(`Response: ${res.statusCode}`, context, undefined, metadata);
    }

    logPerformance(operation: string, duration: number, context?: string, metadata?: LogContext): void {
        const performanceData = {
            operation,
            duration: `${duration}ms`,
            performance: duration > 1000 ? 'slow' : duration > 500 ? 'medium' : 'fast',
        };

        this.log(`Performance: ${operation} took ${duration}ms`, context, performanceData, metadata);
    }

    logSecurity(event: string, context?: string, metadata?: LogContext): void {
        this.warn(`Security Event: ${event}`, context, undefined, metadata);
    }

    logBusiness(event: string, data?: any, context?: string, metadata?: LogContext): void {
        this.log(`Business Event: ${event}`, context, data, metadata);
    }
}
