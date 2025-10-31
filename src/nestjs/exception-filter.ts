import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../core/errors';
import { EnhancedError } from '../types/result.types';
import { ErrorLogger } from '../utils/logger';

/**
 * Global exception filter for NestJS that handles errors in Go style
 */
@Catch()
export class GoStyleExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: ErrorLogger) {}

  catch(exception: Error | HttpException | AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let context: any = {};

    // Handle HttpException from NestJS
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        code = (exceptionResponse as any).error || code;
      }
    }

    // Handle our custom AppError
    if (exception instanceof AppError) {
      status = exception.context?.statusCode || status;
      message = exception.message;
      code = exception.context?.code || code;
      context = exception.context?.metadata || {};

      // Log the error asynchronously
      this.logger.logError(exception, {
        path: request.url,
        method: request.method,
        statusCode: status,
      });
    } else {
      // Log unexpected errors
      this.logger.logError(exception, {
        path: request.url,
        method: request.method,
        statusCode: status,
        isUnexpected: true,
      });
    }

    // Build error response in consistent format
    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(Object.keys(context).length > 0 && { context }),
        ...(process.env.NODE_ENV !== 'production' && {
          stack: exception.stack,
        }),
      },
    };

    response.status(status).json(errorResponse);
  }
}
