# Clean Architecture Overview - Android

## Architecture Layers

### Domain Layer (No Dependencies)
- **Models**: Business models (Order, User, Store) - data classes
- **Use Cases**: Business logic (CreateOrderUseCase, GetOrdersUseCase)
- **Repository Interfaces**: OrdersRepository, UsersRepository

### Data Layer
- **Repository Implementations**: OrdersRepositoryImpl, UsersRepositoryImpl
- **Remote**: Retrofit API services, DTOs
- **Local**: Room DAOs, entities, SharedPreferences

### Presentation Layer
- **ViewModels**: State management, business logic orchestration
- **Composables**: Jetpack Compose UI
- **Navigation**: Navigation Compose graph
- **Theme**: Material Design 3 theme

## Dependency Direction

Dependencies point **inward**:
- Presentation → Domain
- Data → Domain
- Domain has **zero dependencies**

## Request Flow

```
User Interaction
    ↓
Jetpack Compose Screen (Presentation)
    ↓
ViewModel (Presentation)
    ↓
Use Case (Domain)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Data)
    ↓
API/Room (Data)
```
