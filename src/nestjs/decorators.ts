import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Result } from '../types/result.types';
import { AppError } from '../core/errors';

/**
 * Metadata key for error handling
 */
export const ERROR_HANDLING_KEY = 'error_handling';

/**
 * Interface for error handling metadata
 */
export interface ErrorHandlingMetadata {
  logErrors?: boolean;
  transformResult?: boolean;
}

/**
 * Decorator to mark a route as using Go-style error handling
 */
export const GoStyleError = (metadata: ErrorHandlingMetadata = {}) =>
  SetMetadata(ERROR_HANDLING_KEY, metadata);

/**
 * Decorator to automatically unwrap Result tuples in route handlers
 * Throws the error if present, returns the data otherwise
 */
export const UnwrapResult = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const result = request.result;

    if (Array.isArray(result) && result.length === 2) {
      const [value, error] = result as Result<any, Error>;
      if (error !== null) {
        throw error;
      }
      return value;
    }

    return result;
  }
);

/**
 * Decorator to mark errors as operational (expected)
 */
export function Operational(target: any) {
  if (target.prototype instanceof AppError) {
    target.prototype.isOperational = true;
  }
}

/**
 * Decorator to mark errors as programming errors (unexpected)
 */
export function ProgrammingError(target: any) {
  if (target.prototype instanceof AppError) {
    target.prototype.isOperational = false;
  }
}
