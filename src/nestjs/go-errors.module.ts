import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorLogger, ErrorLoggerOptions, initializeLogger } from '../utils/logger';
import { GoStyleExceptionFilter } from './exception-filter';
import { ResultInterceptor, ErrorLoggingInterceptor } from './result-interceptor';

export interface GoErrorsModuleOptions {
  logger?: ErrorLoggerOptions;
  useResultInterceptor?: boolean;
  useErrorLoggingInterceptor?: boolean;
}

export const GO_ERRORS_OPTIONS = 'GO_ERRORS_OPTIONS';
export const ERROR_LOGGER = 'ERROR_LOGGER';

@Global()
@Module({})
export class GoErrorsModule {
  /**
   * Register the module with configuration
   */
  static forRoot(options: GoErrorsModuleOptions = {}): DynamicModule {
    const {
      logger: loggerOptions,
      useResultInterceptor = true,
      useErrorLoggingInterceptor = false,
    } = options;

    // Initialize logger
    const errorLogger = initializeLogger(loggerOptions);

    const providers: Provider[] = [
      {
        provide: GO_ERRORS_OPTIONS,
        useValue: options,
      },
      {
        provide: ERROR_LOGGER,
        useValue: errorLogger,
      },
      {
        provide: ErrorLogger,
        useValue: errorLogger,
      },
      {
        provide: APP_FILTER,
        useFactory: (logger: ErrorLogger) => {
          return new GoStyleExceptionFilter(logger);
        },
        inject: [ERROR_LOGGER],
      },
    ];

    // Add interceptors based on options
    if (useResultInterceptor) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: ResultInterceptor,
      });
    }

    if (useErrorLoggingInterceptor) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: ErrorLoggingInterceptor,
      });
    }

    return {
      module: GoErrorsModule,
      providers,
      exports: [ERROR_LOGGER, ErrorLogger],
    };
  }

  /**
   * Register the module asynchronously
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<GoErrorsModuleOptions> | GoErrorsModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: GO_ERRORS_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: ERROR_LOGGER,
        useFactory: async (opts: GoErrorsModuleOptions) => {
          return initializeLogger(opts.logger);
        },
        inject: [GO_ERRORS_OPTIONS],
      },
      {
        provide: ErrorLogger,
        useFactory: (logger: ErrorLogger) => logger,
        inject: [ERROR_LOGGER],
      },
      {
        provide: APP_FILTER,
        useFactory: (logger: ErrorLogger) => {
          return new GoStyleExceptionFilter(logger);
        },
        inject: [ERROR_LOGGER],
      },
    ];

    return {
      module: GoErrorsModule,
      providers,
      exports: [ERROR_LOGGER, ErrorLogger],
    };
  }
}
