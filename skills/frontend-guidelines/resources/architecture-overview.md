# Clean Architecture Overview - Frontend

## Architecture Layers

### Domain Layer (No Dependencies)
- **Entities**: Business models (Order, User, Store)
- **Repository Interfaces**: IOrdersRepository, IUsersRepository

### Application Layer
- **Use Cases**: GetOrdersUseCase, CreateOrderUseCase
- **Stores**: Zustand stores for global state

### Infrastructure Layer
- **Repository Implementations**: API clients, external services
- **Services**: Third-party integrations
- **Config**: Configuration modules

### Presentation Layer
- **Components**: UI components (Server/Client)
- **Hooks**: Custom React hooks
- **Pages**: Next.js App Router pages

## Dependency Direction

Dependencies point **inward**:
- Presentation → Application → Domain
- Infrastructure → Domain
- Domain has **zero dependencies**

## Component Flow

```
User Interaction
    ↓
Component (Presentation)
    ↓
Use Case (Application)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Infrastructure)
    ↓
API/External Service
```
