/**
 * Result type similar to Go's error handling pattern
 * Returns a tuple with [data, error] where only one should be non-null
 */
export type Result<T, E = Error> = [T, null] | [null, E];

/**
 * Async Result type for promise-based operations
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Error context for additional metadata
 */
export interface ErrorContext {
  code?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
  stack?: string;
  timestamp?: Date;
  operation?: string;
}

/**
 * Enhanced error type with context
 */
export interface EnhancedError extends Error {
  context?: ErrorContext;
  originalError?: Error;
  isOperational?: boolean;
}

/**
 * Type guard to check if value is an error
 */
export function isError(value: any): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if result contains error
 */
export function hasError<T, E = Error>(result: Result<T, E>): result is [null, E] {
  return result[1] !== null;
}

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T, E = Error>(result: Result<T, E>): result is [T, null] {
  return result[0] !== null && result[1] === null;
}
