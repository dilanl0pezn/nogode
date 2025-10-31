import { ErrorContext, EnhancedError } from '../types/result.types';

/**
 * Base error class with context support
 */
export class AppError extends Error implements EnhancedError {
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    context?: ErrorContext,
    originalError?: Error,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.context = {
      ...context,
      timestamp: new Date(),
    };
    this.originalError = originalError;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get full error details including context
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      stack: this.stack,
      isOperational: this.isOperational,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, { ...context, code: 'VALIDATION_ERROR', statusCode: 400 }, originalError);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, { ...context, code: 'NOT_FOUND', statusCode: 404 }, originalError);
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, { ...context, code: 'UNAUTHORIZED', statusCode: 401 }, originalError);
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, { ...context, code: 'FORBIDDEN', statusCode: 403 }, originalError);
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, { ...context, code: 'CONFLICT', statusCode: 409 }, originalError);
  }
}

/**
 * Internal server error
 */
export class InternalError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(
      message,
      { ...context, code: 'INTERNAL_ERROR', statusCode: 500 },
      originalError,
      false
    );
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, { ...context, code: 'EXTERNAL_SERVICE_ERROR', statusCode: 502 }, originalError);
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AppError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, { ...context, code: 'TIMEOUT', statusCode: 408 }, originalError);
  }
}
