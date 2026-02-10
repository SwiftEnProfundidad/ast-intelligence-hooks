---
name: windsurf-rules-backend
description: Reglas Backend (NestJS/TypeScript) del proyecto. Usar en cambios backend.
---
---
alwaysApply: true
---

---
description: Backend rules for NestJS/Node.js/TypeScript
globs: ["apps/backend/**/*.ts", "apps/backend/**/*.spec.ts"]
---

# Backend Rules - NestJS/Node.js/TypeScript

## ANTES de implementar CUALQUIER cosa:

### Fundamentos (heredados de goldrules.md):
✅ **Siempre responder en español**
✅ **Actúa como un Arquitecto de Soluciones y Software Designer**
✅ **Seguir siempre flujo BDD->TDD** - Feature files → Specs → Implementación
✅ **En producción ni un mocks ni un spies** - Todo real de BBDD (Supabase/PostgreSQL)
✅ **No poner comentarios en el código** - Nombres autodescriptivos
✅ **Analizar estructura existente** - Módulos, servicios, repositorios, DTOs
✅ **Verificar que NO viole SOLID** (SRP, OCP, LSP, ISP, DIP)
✅ **No Singleton, en su lugar Inyección de Dependencias** - NestJS DI container
✅ **Seguir Clean Architecture** - Domain → Application → Infrastructure → Presentation
✅ **Preferir early returns** - Guard clauses, evitar if/else anidados
✅ **Comprobar que compile ANTES de sugerir** - npm run build sin errores

### NestJS Architecture:
✅ **Módulos cohesivos** - Un módulo por feature (OrdersModule, UsersModule, etc.)
✅ **Dependency Injection** - @Injectable(), @Inject(), providers array
✅ **Controllers delgados** - Solo routing y validación, lógica en servicios
✅ **Services para lógica de negocio** - Orquestar use cases y repositorios
✅ **Repositories para datos** - Abstraer acceso a BD con interfaces
✅ **DTOs para validación** - class-validator + class-transformer
✅ **Guards para autenticación/autorización** - @UseGuards(JwtAuthGuard)
✅ **Interceptors para logging/transformación** - No en cada endpoint
✅ **Pipes para validación global** - ValidationPipe en main.ts
✅ **Middleware para cross-cutting concerns** - Logging, CORS, etc.

### Clean Architecture en NestJS:

```
src/
  domain/
    entities/              # Entidades de negocio (Order, User, Store)
    repositories/          # Interfaces (IOrdersRepository)
    value-objects/         # Value Objects (Email, Money, Address)
  application/
    use-cases/             # Casos de uso (CreateOrderUseCase)
    dtos/                  # Data Transfer Objects
    events/                # Domain events (OrderCreatedEvent)
  infrastructure/
    database/
      repositories/        # Implementaciones (OrdersRepository)
      migrations/          # Database migrations
    external-services/     # APIs externas, third-party
    config/                # Configuration modules
  presentation/
    controllers/           # HTTP endpoints
    middleware/            # Request/response processing
    guards/                # Auth guards
    interceptors/          # Response transformation
```

### Arquitectura Feature-First + DDD + Clean (Backend):
✅ **Feature-first** - Cada feature es un Bounded Context aislado
✅ **DDD** - entidades, value objects, repositorios, eventos de dominio
✅ **Clean por feature** - presentation → application → domain, infrastructure → domain
✅ **Event-driven** - Comunicación entre features por eventos
✅ **Shared Kernel** - Tipos mínimos compartidos

```
apps/backend/src/
  admin/
    domain/
    application/
    infrastructure/
    presentation/
  orders/
    domain/
    application/
    infrastructure/
    presentation/
  users/
    domain/
    application/
    infrastructure/
    presentation/
```

### Repository Pattern (OBLIGATORIO):
✅ **Interfaces en domain/** - IOrdersRepository, IUsersRepository
✅ **Implementaciones en infrastructure/** - Inyectar dependencia de BD
✅ **No lógica de negocio en repositorios** - Solo CRUD y queries
✅ **Métodos expresivos** - findActiveOrdersByUserId() mejor que find()
✅ **Transacciones** - Para operaciones multi-tabla
✅ **Soft deletes** - deleted_at en lugar de DELETE físico

### Use Cases Pattern:
✅ **Un archivo por use case** - CreateOrderUseCase, UpdateOrderStatusUseCase
✅ **Inyectar repositorios necesarios** - DI en constructor
✅ **Validar precondiciones** - Fail fast
✅ **Emitir eventos de dominio** - OrderCreatedEvent, OrderCancelledEvent
✅ **Retornar DTOs** - No exponer entidades directamente
✅ **Manejo de errores** - Lanzar excepciones específicas

### DTOs y Validación:
✅ **class-validator decorators** - @IsString(), @IsEmail(), @Min(), @Max()
✅ **class-transformer** - @Transform(), @Exclude(), @Expose()
✅ **ValidationPipe global** - En main.ts con whitelist: true
✅ **DTOs separados** - CreateOrderDto, UpdateOrderDto, OrderResponseDto
✅ **Enums para valores fijos** - OrderStatus, PaymentMethod, IncidentType
✅ **Nested validation** - @ValidateNested(), @Type()

### Ejemplos mínimos:
```ts
export class CreateOrderDto {
  @IsString()
  userId!: string
}
```

```ts
const page = Math.max(1, query.page ?? 1)
const limit = Math.min(100, query.limit ?? 20)
```

```ts
const { data } = await supabase
  .from("orders")
  .select("*")
  .range((page - 1) * limit, page * limit - 1)
```

### Database y ORM (Supabase/PostgreSQL):
✅ **Supabase client** - @supabase/supabase-js
✅ **Queries parametrizadas** - Prevenir SQL injection
✅ **Índices apropiados** - Para queries frecuentes
✅ **Migrations versionadas** - Nunca modificar migraciones pasadas
✅ **Transacciones** - Para operaciones críticas
✅ **Connection pooling** - Configurar max_connections
✅ **Query optimization** - EXPLAIN ANALYZE para queries lentas

### Autenticación y Autorización:
✅ **JWT strategy** - @nestjs/jwt + @nestjs/passport
✅ **Guards en todas las rutas protegidas** - @UseGuards(JwtAuthGuard)
✅ **Role-based access control** - @Roles('admin', 'user')
✅ **Refresh tokens** - No solo access tokens
✅ **Password hashing** - bcrypt con salt rounds >= 10
✅ **Rate limiting** - @nestjs/throttler para prevenir brute force
✅ **CORS configurado** - Solo orígenes permitidos

### Event-Driven Architecture:
✅ **Event Bus** - @nestjs/event-emitter o custom
✅ **Domain events** - OrderCreatedEvent, UserRegisteredEvent
✅ **Event handlers** - @OnEvent('order.created')
✅ **Async processing** - No bloquear request principal
✅ **Event store** - Log de eventos para auditoría
✅ **Idempotencia** - Eventos procesables múltiples veces sin efectos secundarios

### Caché (Redis):
✅ **Cache-Manager** - @nestjs/cache-manager
✅ **Redis** - Para caché distribuido
✅ **Estrategia de invalidación** - TTL + invalidación explícita
✅ **Cache-aside pattern** - Leer de caché, si no existe, leer de BD y cachear
✅ **No cachear datos sensibles** - O cifrar antes de cachear
✅ **Key naming convention** - "module:entity:id" (orders:order:123)

### Logging y Observabilidad:
✅ **Winston** - Logger estructurado (JSON logs)
✅ **Log levels** - ERROR, WARN, INFO, DEBUG
✅ **Contexto en logs** - userId, requestId, traceId
✅ **No loggear datos sensibles** - Passwords, tokens, PII
✅ **Correlation IDs** - Para tracing distribuido
✅ **Métricas Prometheus** - prom-client para métricas
✅ **Health checks** - /health endpoint (liveness, readiness)

### Testing Backend:
✅ **Jest** - Framework de testing
✅ **Unit tests** - Servicios, use cases con mocks
✅ **Integration tests** - Controllers + Services + Repositorios reales
✅ **E2E tests** - Supertest para flujos completos
✅ **Test DB** - Base de datos separada para tests
✅ **makeSUT pattern** - System Under Test factory
✅ **AAA pattern** - Arrange, Act, Assert
✅ **Coverage >95%** - En lógica crítica
✅ **Fast tests** - <100ms integración, <10ms unitarios

### Error Handling:
✅ **Custom exceptions** - ValidationException, NotFoundException, UnauthorizedException
✅ **Exception filters** - @Catch() para manejo global
✅ **HTTP status codes apropiados** - 200, 201, 400, 401, 403, 404, 500
✅ **Error responses consistentes** - { statusCode, message, timestamp, path }
✅ **No exponer stack traces** - Solo en desarrollo
✅ **Loggear errores** - Con contexto completo

### Seguridad:
✅ **Helmet** - Security headers
✅ **CORS** - Configurar orígenes permitidos
✅ **Rate limiting** - Throttler para prevenir abuse
✅ **Input validation** - SIEMPRE validar con DTOs
✅ **SQL injection prevention** - Queries parametrizadas
✅ **XSS prevention** - Sanitizar inputs
✅ **HTTPS redirect** - En producción
✅ **Secrets management** - Variables de entorno, nunca en código
✅ **Audit logging** - Registrar cambios críticos

### Performance:
✅ **Database indexing** - Índices en columnas frecuentes en WHERE/JOIN
✅ **N+1 query prevention** - Eager loading cuando sea apropiado
✅ **Pagination** - SIEMPRE para listas (offset/limit o cursor-based)
✅ **Query optimization** - EXPLAIN ANALYZE
✅ **Caching** - Redis para datos frecuentes
✅ **Compression** - gzip para responses grandes
✅ **Connection pooling** - Reutilizar conexiones de BD

### API Design:
✅ **RESTful** - GET, POST, PUT, PATCH, DELETE apropiados
✅ **Versionado** - /api/v1/, /api/v2/
✅ **Naming conventions** - Plurales para colecciones (/orders, /users)
✅ **HTTP status codes** - Semántica correcta
✅ **Swagger/OpenAPI** - @nestjs/swagger para documentación
✅ **Idempotencia** - PUT y DELETE idempotentes
✅ **HATEOAS (opcional)** - Links en responses para navegación

### Configuración:
✅ **@nestjs/config** - ConfigModule para variables de entorno
✅ **Validation de config** - Joi o class-validator para .env
✅ **Secrets separados** - AWS Secrets Manager, HashiCorp Vault
✅ **Config por entorno** - .env.development, .env.production
✅ **No defaults en producción** - Fallar si falta config crítica

### Documentación:
✅ **Swagger** - @nestjs/swagger, decoradores @ApiProperty()
✅ **README por módulo** - Explicar responsabilidad del módulo
✅ **JSDoc mínimo** - Solo para APIs públicas o lógica compleja
✅ **Diagramas C4** - Context, Container, Component para arquitectura

### Específicas para RuralGO:
✅ **Repository pattern SIEMPRE** - IOrdersRepository, OrdersRepository
✅ **Use Cases explícitos** - CreateOrderUseCase, UpdateOrderStatusUseCase
✅ **DTOs en boundaries** - Validación en entrada/salida
✅ **Event sourcing para auditoría** - audit_logs table
✅ **Soft deletes por defecto** - deleted_at column
✅ **Métricas de negocio** - KPIs, analytics
✅ **i18n en error messages** - Mensajes traducibles

### Anti-patterns a EVITAR:
❌ **God classes** - Servicios con >500 líneas
❌ **Anemic domain models** - Entidades solo con getters/setters
❌ **Magic numbers** - Usar constantes con nombres descriptivos
❌ **Callback hell** - Usar async/await
❌ **Hardcoded values** - Config en variables de entorno
❌ **Mocks en producción** - Solo datos reales
❌ **try-catch silenciosos** - Siempre loggear o propagar (AST: common.error.empty_catch)
❌ **Lógica en controllers** - Mover a servicios/use cases

### Principio fundamental:
✅ **"Measure twice, cut once"** - Planificar arquitectura, dependencias y flujo de datos antes de implementar. Analizar impacto en BD, caché y performance.
