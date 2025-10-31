import { Result, AsyncResult, ErrorContext, EnhancedError } from '../types/result.types';
import { AppError } from '../core/errors';

/**
 * Creates a successful result tuple
 */
export function Ok<T>(data: T): Result<T, never> {
  return [data, null];
}

/**
 * Creates an error result tuple
 */
export function Err<E = Error>(error: E): Result<never, E> {
  return [null, error];
}

/**
 * Wraps a synchronous function to return Result instead of throwing
 */
export function trySync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const result = fn();
    return Ok(result);
  } catch (error) {
    return Err(error as E);
  }
}

/**
 * Wraps an async function to return AsyncResult instead of throwing
 */
export async function tryAsync<T, E = Error>(fn: () => Promise<T>): AsyncResult<T, E> {
  try {
    const result = await fn();
    return Ok(result);
  } catch (error) {
    return Err(error as E);
  }
}

/**
 * Wraps a promise to return AsyncResult
 */
export async function wrapPromise<T, E = Error>(promise: Promise<T>): AsyncResult<T, E> {
  return tryAsync(() => promise);
}

/**
 * Unwraps a Result, throwing if it contains an error
 */
export function unwrap<T, E = Error>(result: Result<T, E>): T {
  const [data, error] = result;
  if (error !== null) {
    throw error;
  }
  return data as T;
}

/**
 * Unwraps a Result, returning default value if it contains an error
 */
export function unwrapOr<T, E = Error>(result: Result<T, E>, defaultValue: T): T {
  const [data, error] = result;
  if (error !== null) {
    return defaultValue;
  }
  return data as T;
}

/**
 * Maps a successful result to a new value
 */
export function map<T, U, E = Error>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  const [data, error] = result;
  if (error !== null) {
    return [null, error];
  }
  return Ok(fn(data as T));
}

/**
 * Maps an async successful result to a new value
 */
export async function mapAsync<T, U, E = Error>(
  result: AsyncResult<T, E>,
  fn: (data: T) => U | Promise<U>
): AsyncResult<U, E> {
  const [data, error] = await result;
  if (error !== null) {
    return [null, error];
  }
  const mapped = await fn(data as T);
  return Ok(mapped);
}

/**
 * Maps an error to a new error
 */
export function mapError<T, E = Error, F = Error>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  const [data, error] = result;
  if (error !== null) {
    return Err(fn(error));
  }
  return [data as T, null];
}

/**
 * Chains multiple Results together
 */
export function chain<T, U, E = Error>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  const [data, error] = result;
  if (error !== null) {
    return [null, error];
  }
  return fn(data as T);
}

/**
 * Chains multiple AsyncResults together
 */
export async function chainAsync<T, U, E = Error>(
  result: AsyncResult<T, E>,
  fn: (data: T) => AsyncResult<U, E>
): AsyncResult<U, E> {
  const [data, error] = await result;
  if (error !== null) {
    return [null, error];
  }
  return fn(data as T);
}

/**
 * Combines multiple Results into a single Result with array of values
 */
export function combine<T, E = Error>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = [];
  for (const result of results) {
    const [value, error] = result;
    if (error !== null) {
      return [null, error];
    }
    data.push(value as T);
  }
  return Ok(data);
}

/**
 * Combines multiple AsyncResults into a single AsyncResult with array of values
 */
export async function combineAsync<T, E = Error>(
  results: AsyncResult<T, E>[]
): AsyncResult<T[], E> {
  const resolved = await Promise.all(results);
  return combine(resolved);
}

/**
 * Wraps an error with additional context
 */
export function wrapError(
  error: Error,
  message: string,
  context?: ErrorContext
): AppError {
  return new AppError(message, context, error);
}

/**
 * Creates an enhanced error from a regular error
 */
export function enhanceError(
  error: Error,
  context?: ErrorContext
): EnhancedError {
  if ('context' in error) {
    return error as EnhancedError;
  }
  return new AppError(error.message, context, error);
}

/**
 * Checks if error is operational (expected) or programming error
 */
export function isOperationalError(error: any): boolean {
  if (error && typeof error === 'object' && 'isOperational' in error) {
    return error.isOperational === true;
  }
  return false;
}
