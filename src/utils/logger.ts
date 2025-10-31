import pino, { Logger, LoggerOptions } from 'pino';
import { EnhancedError } from '../types/result.types';

export interface ErrorLoggerOptions extends LoggerOptions {
  prettify?: boolean;
  redactPaths?: string[];
}

/**
 * Logger service with Pino for error tracking
 */
export class ErrorLogger {
  private logger: Logger;

  constructor(options?: ErrorLoggerOptions) {
    const { prettify = false, redactPaths = [], ...pinoOptions } = options || {};

    const baseOptions: LoggerOptions = {
      ...pinoOptions,
      redact: {
        paths: [
          'password',
          'token',
          'authorization',
          'cookie',
          'secret',
          ...redactPaths,
        ],
        remove: true,
      },
    };

    if (prettify && process.env.NODE_ENV !== 'production') {
      this.logger = pino({
        ...baseOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      });
    } else {
      this.logger = pino(baseOptions);
    }
  }

  /**
   * Log an error with full context
   */
  logError(error: Error | EnhancedError, additionalContext?: Record<string, any>): void {
    const enhancedError = error as EnhancedError;
    const logObject: any = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    };

    if (enhancedError.context) {
      logObject.context = enhancedError.context;
    }

    if (enhancedError.originalError) {
      logObject.originalError = {
        name: enhancedError.originalError.name,
        message: enhancedError.originalError.message,
        stack: enhancedError.originalError.stack,
      };
    }

    if (enhancedError.isOperational === false) {
      this.logger.fatal(logObject, 'Programming Error');
    } else {
      this.logger.error(logObject, 'Operational Error');
    }
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(context, message);
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, any>): void {
    this.logger.info(context, message);
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(context, message);
  }

  /**
   * Get the underlying Pino logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, any>): ErrorLogger {
    const childLogger = new ErrorLogger();
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
}

/**
 * Global logger instance
 */
let globalLogger: ErrorLogger | null = null;

/**
 * Initialize global logger
 */
export function initializeLogger(options?: ErrorLoggerOptions): ErrorLogger {
  globalLogger = new ErrorLogger(options);
  return globalLogger;
}

/**
 * Get global logger instance
 */
export function getLogger(): ErrorLogger {
  if (!globalLogger) {
    globalLogger = new ErrorLogger();
  }
  return globalLogger;
}

/**
 * Async error logger that doesn't block execution
 */
export async function logErrorAsync(
  error: Error | EnhancedError,
  context?: Record<string, any>
): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(() => {
      getLogger().logError(error, context);
      resolve();
    });
  });
}
