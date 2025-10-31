import { Controller, Get, Post, Body, Param, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  GoErrorsModule,
  Result,
  Ok,
  Err,
  NotFoundError,
  ValidationError,
  tryAsync,
  ErrorLogger,
} from '../src';

// DTOs
class CreateUserDto {
  name: string;
  email: string;
}

// Service with Go-style error handling
class UserService {
  private users = new Map<string, any>();

  constructor(private readonly logger: ErrorLogger) {
    // Add some sample users
    this.users.set('1', { id: '1', name: 'John Doe', email: 'john@example.com' });
    this.users.set('2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' });
  }

  async findOne(id: string): Promise<Result<any, Error>> {
    this.logger.debug('Finding user', { userId: id });

    if (!id) {
      return Err(new ValidationError('User ID is required'));
    }

    const user = this.users.get(id);
    
    if (!user) {
      return Err(
        new NotFoundError('User not found', {
          metadata: { userId: id },
        })
      );
    }

    return Ok(user);
  }

  async findAll(): Promise<Result<any[], Error>> {
    return tryAsync(async () => {
      const users = Array.from(this.users.values());
      this.logger.info('Retrieved all users', { count: users.length });
      return users;
    });
  }

  async create(dto: CreateUserDto): Promise<Result<any, Error>> {
    if (!dto.name || !dto.email) {
      return Err(
        new ValidationError('Name and email are required', {
          metadata: { dto },
        })
      );
    }

    return tryAsync(async () => {
      const id = String(this.users.size + 1);
      const user = { id, ...dto };
      this.users.set(id, user);
      
      this.logger.info('User created', { userId: id });
      return user;
    });
  }

  async delete(id: string): Promise<Result<void, Error>> {
    const [user, err] = await this.findOne(id);
    
    if (err) {
      return Err(err);
    }

    this.users.delete(id);
    this.logger.info('User deleted', { userId: id });
    return Ok(undefined as void);
  }
}

// Controller using Go-style error handling
@Controller('users')
class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: ErrorLogger
  ) {}

  // The ResultInterceptor will automatically transform Result tuples
  // into proper HTTP responses
  @Get()
  async findAll(): Promise<Result<any[], Error>> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Result<any, Error>> {
    return this.userService.findOne(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<Result<any, Error>> {
    return this.userService.create(createUserDto);
  }

  // You can also handle results manually
  @Get(':id/manual')
  async findOneManual(@Param('id') id: string) {
    const [user, err] = await this.userService.findOne(id);
    
    if (err) {
      // This will be caught by the GoStyleExceptionFilter
      throw err;
    }

    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }
}

// Main module
@Module({
  imports: [
    GoErrorsModule.forRoot({
      logger: {
        prettify: true,
        level: 'debug',
      },
      useResultInterceptor: true,
      useErrorLoggingInterceptor: false,
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
class AppModule {}

// Bootstrap application
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('\nTry these endpoints:');
  console.log('  GET  http://localhost:3000/users');
  console.log('  GET  http://localhost:3000/users/1');
  console.log('  GET  http://localhost:3000/users/999 (not found)');
  console.log('  POST http://localhost:3000/users');
  console.log('       Body: { "name": "Alice", "email": "alice@example.com" }');
}

// Run if this is the main module
if (require.main === module) {
  bootstrap().catch(console.error);
}

export { AppModule, UserController, UserService };
