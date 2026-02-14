---
name: backend-guidelines
description: Comprehensive backend development guide for NestJS/TypeScript with Supabase/PostgreSQL. Use when creating controllers, services, repositories, use cases, DTOs, guards, interceptors, or working with NestJS APIs, Supabase database access, Clean Architecture patterns, dependency injection, or async patterns. Covers Clean Architecture (domain → application → infrastructure → presentation), Repository pattern, Use Cases, DTOs validation, error handling, and testing strategies.
---

# Backend Development Guidelines

## Purpose

Establish consistency and best practices across backend services using NestJS/TypeScript with Supabase/PostgreSQL, following Clean Architecture principles.

## When to Use This Skill

Automatically activates when working on:
- Creating or modifying controllers, services, repositories
- Building use cases and DTOs
- Implementing guards, interceptors, pipes
- Database operations with Supabase
- Error handling and validation
- Backend testing and refactoring
- Clean Architecture patterns

---

## Quick Start

### New Backend Feature Checklist

- [ ] **Controller**: Thin controller, delegate to use case
- [ ] **Use Case**: Business logic orchestration
- [ ] **Repository**: Interface in domain/, implementation in infrastructure/
- [ ] **DTO**: Validation with class-validator
- [ ] **Entity**: Domain model in domain/entities/
- [ ] **Tests**: Unit + integration tests
- [ ] **Error Handling**: Custom exceptions
- [ ] **No empty catch**: Empty `catch` blocks are forbidden (AST: common.error.empty_catch)

### New Module Checklist

- [ ] Directory structure (see [architecture-overview.md](resources/architecture-overview.md))
- [ ] Module definition with providers
- [ ] Repository interface in domain/
- [ ] Repository implementation in infrastructure/
- [ ] Use cases in application/
- [ ] DTOs in application/dtos/
- [ ] Controller in presentation/
- [ ] Testing setup

---

## Architecture Overview

### Clean Architecture Layers

```
HTTP Request
    ↓
Presentation (Controllers, Guards, Interceptors)
    ↓
Application (Use Cases, DTOs, Events)
    ↓
Domain (Entities, Repository Interfaces, Value Objects)
    ↓
Infrastructure (Repository Implementations, Database, External Services)
```

**Key Principle:** Dependencies point inward. Domain has no dependencies.

See [architecture-overview.md](resources/architecture-overview.md) for complete details.

---

## Directory Structure

```
apps/backend/src/
├── domain/
│   ├── entities/              # Business models (Order, User, Store)
│   ├── repositories/          # Interfaces (IOrdersRepository)
│   └── value-objects/         # Value Objects (Email, Money)
├── application/
│   ├── use-cases/             # Business logic (CreateOrderUseCase)
│   ├── dtos/                  # Data Transfer Objects
│   └── events/                # Domain events
├── infrastructure/
│   ├── database/
│   │   ├── repositories/      # Implementations (OrdersRepository)
│   │   └── migrations/        # Database migrations
│   ├── external-services/     # Third-party APIs
│   └── config/                # Configuration modules
└── presentation/
    ├── controllers/           # HTTP endpoints
    ├── guards/                # Auth guards
    └── interceptors/          # Response transformation
```

**Naming Conventions:**
- Controllers: `PascalCase + Controller` - `OrdersController.ts`
- Use Cases: `PascalCase + UseCase` - `CreateOrderUseCase.ts`
- Repositories: `PascalCase + Repository` - `OrdersRepository.ts`
- DTOs: `PascalCase + Dto` - `CreateOrderDto.ts`
- Entities: `PascalCase` - `Order.ts`

---

## Core Principles

### 1. Clean Architecture Layers

```typescript
// Domain (no dependencies)
export interface IOrdersRepository {
    findById(id: string): Promise<Order | null>;
}

// Infrastructure (implements domain interface)
@Injectable()
export class OrdersRepository implements IOrdersRepository {
    constructor(private supabase: SupabaseClient) {}
}

// Application (use cases)
@Injectable()
export class CreateOrderUseCase {
    constructor(private ordersRepo: IOrdersRepository) {}
}

// Presentation (controllers)
@Controller('orders')
export class OrdersController {
    constructor(private createOrderUseCase: CreateOrderUseCase) {}
}
```

### 2. Repository Pattern (OBLIGATORIO)

```typescript
// Interface in domain/repositories/
export interface IOrdersRepository {
    findActiveOrdersByUserId(userId: string): Promise<Order[]>;
}

// Implementation in infrastructure/database/repositories/
@Injectable()
export class OrdersRepository implements IOrdersRepository {
    constructor(private supabase: SupabaseClient) {}
    
    async findActiveOrdersByUserId(userId: string): Promise<Order[]> {
        const { data } = await this.supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null);
        return data.map(d => Order.fromDatabase(d));
    }
}
```

### 3. Use Cases Pattern

```typescript
@Injectable()
export class CreateOrderUseCase {
    constructor(
        private ordersRepo: IOrdersRepository,
        private eventEmitter: EventEmitter2
    ) {}
    
    async execute(dto: CreateOrderDto): Promise<OrderResponseDto> {
        const order = Order.create(dto);
        const saved = await this.ordersRepo.save(order);
        this.eventEmitter.emit('order.created', saved);
        return OrderResponseDto.fromEntity(saved);
    }
}
```

### 4. DTOs with Validation

```typescript
export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    userId: string;
    
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}
```

### 5. Error Handling

```typescript
export class OrderNotFoundException extends NotFoundException {
    constructor(orderId: string) {
        super(`Order with ID ${orderId} not found`);
    }
}
```

### 6. Dependency Injection

```typescript
@Module({
    providers: [
        CreateOrderUseCase,
        { provide: 'IOrdersRepository', useClass: OrdersRepository }
    ],
    controllers: [OrdersController]
})
export class OrdersModule {}
```

### 7. Testing Required

```typescript
describe('CreateOrderUseCase', () => {
    it('should create order', async () => {
        const order = await useCase.execute(dto);
        expect(order).toBeDefined();
    });
});
```

---

## Common Imports

```typescript
// NestJS
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Injectable, Inject } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';

// Validation
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// Supabase
import { SupabaseClient } from '@supabase/supabase-js';

// Domain
import { Order } from '../../domain/entities/Order';
import { IOrdersRepository } from '../../domain/repositories/IOrdersRepository';
```

---

## Quick Reference

### HTTP Status Codes

| Code | Use Case |
|------|----------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Anti-Patterns to Avoid

❌ Business logic in controllers
❌ Direct SupabaseClient usage in controllers
❌ Missing repository interfaces
❌ No input validation
❌ Direct entity exposure in responses
❌ Missing error handling

---

## Navigation Guide

| Need to... | Read this |
|------------|-----------|
| Understand architecture | [architecture-overview.md](resources/architecture-overview.md) |
| Create controllers | [controllers-guide.md](resources/controllers-guide.md) |
| Implement use cases | [use-cases-guide.md](resources/use-cases-guide.md) |
| Repository pattern | [repositories-guide.md](resources/repositories-guide.md) |
| Validate input | [dto-validation.md](resources/dto-validation.md) |
| Handle errors | [error-handling.md](resources/error-handling.md) |
| Database access | [supabase-patterns.md](resources/supabase-patterns.md) |
| Write tests | [testing-guide.md](resources/testing-guide.md) |
| See examples | [complete-examples.md](resources/complete-examples.md) |

---

## Resource Files

### [architecture-overview.md](resources/architecture-overview.md)
Clean Architecture layers, dependency direction, separation of concerns

### [controllers-guide.md](resources/controllers-guide.md)
Thin controllers, use case delegation, error handling

### [use-cases-guide.md](resources/use-cases-guide.md)
Business logic orchestration, event emission, DTOs

### [repositories-guide.md](resources/repositories-guide.md)
Repository interfaces, Supabase implementations, transactions

### [dto-validation.md](resources/dto-validation.md)
class-validator decorators, nested validation, transformation

### [error-handling.md](resources/error-handling.md)
Custom exceptions, error filters, HTTP status codes

### [supabase-patterns.md](resources/supabase-patterns.md)
SupabaseClient usage, queries, transactions, migrations

### [testing-guide.md](resources/testing-guide.md)
Unit/integration tests, mocking, coverage

### [complete-examples.md](resources/complete-examples.md)
Full examples, refactoring guide

---

## Related Skills

- **frontend-guidelines** - Frontend development patterns
- **ios-guidelines** - iOS development patterns
- **android-guidelines** - Android development patterns
- **skill-developer** - Meta-skill for creating and managing skills

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**Progressive Disclosure**: 9 resource files ✅
