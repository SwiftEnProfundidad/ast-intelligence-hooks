# Clean Architecture Overview - Backend

## Architecture Layers

### Domain Layer (No Dependencies)
- **Entities**: Business models (Order, User, Store)
- **Repository Interfaces**: IOrdersRepository, IUsersRepository
- **Value Objects**: Email, Money, Address

### Application Layer
- **Use Cases**: CreateOrderUseCase, UpdateOrderStatusUseCase
- **DTOs**: CreateOrderDto, UpdateOrderDto, OrderResponseDto
- **Events**: OrderCreatedEvent, OrderCancelledEvent

### Infrastructure Layer
- **Repository Implementations**: OrdersRepository, UsersRepository
- **Database**: Supabase client, migrations
- **External Services**: Third-party APIs
- **Config**: Configuration modules

### Presentation Layer
- **Controllers**: HTTP endpoints
- **Guards**: Authentication/authorization
- **Interceptors**: Response transformation
- **Pipes**: Validation

## Dependency Direction

Dependencies point **inward**:
- Presentation → Application → Domain
- Infrastructure → Domain
- Domain has **zero dependencies**

## Request Flow

```
HTTP Request
    ↓
Controller (Presentation)
    ↓
Use Case (Application)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Infrastructure)
    ↓
Supabase Database
```
