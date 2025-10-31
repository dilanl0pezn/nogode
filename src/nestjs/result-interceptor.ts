import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Result } from '../types/result.types';
import { AppError } from '../core/errors';

/**
 * Response format for successful operations
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp?: string;
}

/**
 * Interceptor that transforms Result tuples into HTTP responses
 */
@Injectable()
export class ResultInterceptor<T> implements NestInterceptor<Result<T, Error>, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // If it's already a formatted response, return as is
        if (result && typeof result === 'object' && 'success' in result) {
          return result;
        }

        // If it's a Result tuple
        if (Array.isArray(result) && result.length === 2) {
          const [data, error] = result as Result<T, Error>;

          if (error !== null) {
            // Throw the error to be caught by the exception filter
            throw error;
          }

          // Return successful response
          return {
            success: true as const,
            data,
            timestamp: new Date().toISOString(),
          };
        }

        // If it's raw data, wrap it in success response
        return {
          success: true as const,
          data: result,
          timestamp: new Date().toISOString(),
        };
      }),
      catchError((error) => {
        // Re-throw to be handled by exception filter
        return throwError(() => error);
      })
    );
  }
}

/**
 * Interceptor that automatically logs errors but doesn't transform responses
 */
@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Error will be logged by the exception filter
        return throwError(() => error);
      })
    );
  }
}
