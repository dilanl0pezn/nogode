# Go-Style Error Handling for Node.js

Uma biblioteca moderna para tratamento de erros em Node.js inspirada no padrão de Go, com suporte completo para TypeScript, JavaScript e integração nativa com NestJS. Utiliza Pino para logging assíncrono de alta performance.

## 🚀 Características

- ✅ **Padrão Go-style**: Retorna tuplas `[data, error]` ao invés de lançar exceções
- 🎯 **Type-Safe**: Totalmente tipado com TypeScript
- 🔌 **Integração NestJS**: Módulo, filtros e interceptors prontos para uso
- 📝 **Logging Assíncrono**: Integração com Pino para logs de alta performance
- 🎨 **Erros Customizados**: Hierarquia de erros com contexto rico
- 🔄 **Composição Funcional**: Utilitários para compor operações com Results
- 🛡️ **Segurança**: Redação automática de dados sensíveis nos logs

## 📦 Instalação

```bash
npm install go-errors-node pino
# ou
yarn add go-errors-node pino
```

Para uso com NestJS, instale também:

```bash
npm install @nestjs/common @nestjs/core reflect-metadata
```

## 🎯 Uso Básico

### Pattern Go-Style Simples

```typescript
import { Ok, Err, Result, ValidationError } from 'go-errors-node';

function findUser(id: string): Result<User, Error> {
  if (!id) {
    return Err(new ValidationError('User ID is required'));
  }

  const user = database.findById(id);
  
  if (!user) {
    return Err(new NotFoundError('User not found'));
  }

  return Ok(user);
}

// Usando o resultado
const [user, err] = findUser('123');

if (err) {
  console.error('Error:', err.message);
  return;
}

console.log('User:', user.name);
```

### Operações Assíncronas

```typescript
import { tryAsync, wrapPromise } from 'go-errors-node';

// Envolver funções async
async function fetchUser(id: string) {
  return tryAsync(async () => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  });
}

// Ou envolver promises diretamente
async function getData() {
  const [data, err] = await wrapPromise(
    fetch('/api/data').then(r => r.json())
  );
  
  if (err) {
    // Tratar erro
    return;
  }
  
  // Usar data
}
```

### Composição de Operações

```typescript
import { chain, map, combine } from 'go-errors-node';

// Encadear operações
const result = chain(
  await findUser(userId),
  (user) => validateUser(user)
);

// Mapear valores
const result = map(
  await findUser(userId),
  (user) => user.name.toUpperCase()
);

// Combinar múltiplos resultados
const userIds = ['1', '2', '3'];
const results = await Promise.all(userIds.map(findUser));
const [users, err] = combine(results);
```

## 🏗️ Integração com NestJS

### Configuração do Módulo

```typescript
import { Module } from '@nestjs/common';
import { GoErrorsModule } from 'go-errors-node';

@Module({
  imports: [
    GoErrorsModule.forRoot({
      logger: {
        prettify: process.env.NODE_ENV !== 'production',
        level: 'info',
        redactPaths: ['password', 'token', 'secret'],
      },
      useResultInterceptor: true,
      useErrorLoggingInterceptor: false,
    }),
  ],
})
export class AppModule {}
```

### Service com Error Handling

```typescript
import { Injectable } from '@nestjs/common';
import { 
  Result, 
  Ok, 
  Err, 
  NotFoundError, 
  ValidationError,
  ErrorLogger 
} from 'go-errors-node';

@Injectable()
export class UserService {
  constructor(private readonly logger: ErrorLogger) {}

  async findOne(id: string): Promise<Result<User, Error>> {
    this.logger.debug('Finding user', { userId: id });

    if (!id) {
      return Err(new ValidationError('User ID is required'));
    }

    const user = await this.userRepository.findById(id);
    
    if (!user) {
      return Err(
        new NotFoundError('User not found', {
          metadata: { userId: id },
        })
      );
    }

    return Ok(user);
  }

  async create(dto: CreateUserDto): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.create(dto);
      this.logger.info('User created', { userId: user.id });
      return Ok(user);
    } catch (error) {
      return Err(
        new InternalError('Failed to create user', {
          metadata: { dto },
        }, error)
      );
    }
  }
}
```

### Controller

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Result } from 'go-errors-node';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // O ResultInterceptor transforma automaticamente em HTTP response
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Result<User, Error>> {
    return this.userService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<Result<User, Error>> {
    return this.userService.create(dto);
  }

  // Você também pode tratar manualmente
  @Get(':id/manual')
  async findOneManual(@Param('id') id: string) {
    const [user, err] = await this.userService.findOne(id);
    
    if (err) {
      throw err; // Será capturado pelo GoStyleExceptionFilter
    }

    return { success: true, data: user };
  }
}
```

### Formato de Resposta

#### Sucesso
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2025-10-31T10:00:00.000Z"
}
```

#### Erro
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "statusCode": 404,
    "timestamp": "2025-10-31T10:00:00.000Z",
    "path": "/users/999",
    "context": {
      "userId": "999"
    }
  }
}
```

## 🎨 Tipos de Erros Inclusos

```typescript
// Erros de validação (400)
new ValidationError('Invalid input');

// Não encontrado (404)
new NotFoundError('Resource not found');

// Não autorizado (401)
new UnauthorizedError('Authentication required');

// Proibido (403)
new ForbiddenError('Access denied');

// Conflito (409)
new ConflictError('Resource already exists');

// Erro interno (500)
new InternalError('Internal server error');

// Erro de serviço externo (502)
new ExternalServiceError('External API failed');

// Timeout (408)
new TimeoutError('Request timeout');
```

## 📝 Logging com Pino

```typescript
import { initializeLogger, getLogger } from 'go-errors-node';

// Inicializar logger globalmente
const logger = initializeLogger({
  prettify: true,
  level: 'debug',
  redactPaths: ['password', 'creditCard', 'ssn'],
});

// Usar em qualquer lugar
const logger = getLogger();

// Log de erro com contexto
logger.logError(error, {
  userId: '123',
  operation: 'createUser',
});

// Outros níveis de log
logger.info('User created', { userId: '123' });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.debug('Cache miss', { key: 'user:123' });

// Logger filho com contexto
const childLogger = logger.child({ service: 'UserService' });
```

## 🛠️ Utilitários Avançados

### Unwrap

```typescript
import { unwrap, unwrapOr } from 'go-errors-node';

// Unwrap (lança exceção se houver erro)
try {
  const user = unwrap(await findUser(id));
  console.log(user);
} catch (error) {
  console.error(error);
}

// Unwrap com valor padrão
const user = unwrapOr(await findUser(id), { id: 'guest', name: 'Guest' });
```

### Map e MapError

```typescript
import { map, mapError } from 'go-errors-node';

// Transformar dados de sucesso
const result = map(
  await findUser(id),
  (user) => ({ ...user, fullName: `${user.firstName} ${user.lastName}` })
);

// Transformar erro
const result = mapError(
  await findUser(id),
  (error) => new AppError(`Failed to find user: ${error.message}`)
);
```

### Operações em Lote

```typescript
import { combine, combineAsync } from 'go-errors-node';

// Combinar resultados síncronos
const results = [
  findUser('1'),
  findUser('2'),
  findUser('3'),
];
const [users, err] = combine(results);

// Combinar resultados assíncronos
const asyncResults = [
  fetchUser('1'),
  fetchUser('2'),
  fetchUser('3'),
];
const [users, err] = await combineAsync(asyncResults);
```

## 🔧 Configuração Avançada

### Configuração Assíncrona do Módulo

```typescript
@Module({
  imports: [
    GoErrorsModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        logger: {
          level: configService.get('LOG_LEVEL'),
          prettify: configService.get('NODE_ENV') !== 'production',
        },
        useResultInterceptor: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## 📚 API Completa

### Core Functions

- `Ok<T>(data: T)` - Cria Result de sucesso
- `Err<E>(error: E)` - Cria Result de erro
- `trySync<T>(fn: () => T)` - Envolve função síncrona
- `tryAsync<T>(fn: () => Promise<T>)` - Envolve função assíncrona
- `wrapPromise<T>(promise: Promise<T>)` - Envolve promise
- `unwrap<T>(result: Result<T>)` - Extrai valor ou lança erro
- `unwrapOr<T>(result: Result<T>, default: T)` - Extrai valor ou retorna padrão
- `map<T, U>(result: Result<T>, fn)` - Transforma valor de sucesso
- `mapError<T, E, F>(result: Result<T, E>, fn)` - Transforma erro
- `chain<T, U>(result: Result<T>, fn)` - Encadeia operações
- `combine<T>(results: Result<T>[])` - Combina múltiplos results

### Type Guards

- `isError(value: any)` - Verifica se é erro
- `hasError<T>(result: Result<T>)` - Verifica se result tem erro
- `isSuccess<T>(result: Result<T>)` - Verifica se result é sucesso
- `isOperationalError(error: any)` - Verifica se erro é operacional

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

MIT

## 🙏 Inspiração

Esta biblioteca foi inspirada pelo elegante sistema de tratamento de erros do Go, adaptado para o ecossistema Node.js/TypeScript.
