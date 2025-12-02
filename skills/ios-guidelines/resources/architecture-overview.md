# Clean Architecture Overview - iOS

## Architecture Layers

### Domain Layer (No Dependencies)
- **Entities**: Business models (Order, User, Store) - structs
- **Use Cases**: Business logic (CreateOrderUseCase, GetOrdersUseCase)
- **Repository Protocols**: OrdersRepositoryProtocol, UsersRepositoryProtocol

### Application Layer
- **ViewModels**: ObservableObject for SwiftUI binding
- **Coordinators**: Navigation logic (TCA-based)

### Infrastructure Layer
- **Repository Implementations**: OrdersRepository, UsersRepository
- **Network**: API client (URLSession, async/await)
- **Persistence**: Core Data, Keychain, UserDefaults

### Presentation Layer
- **Views**: SwiftUI views
- **Components**: Reusable UI components
- **TCA Integration**: The Composable Architecture for state management

## Dependency Direction

Dependencies point **inward**:
- Presentation → Application → Domain
- Infrastructure → Domain
- Domain has **zero dependencies**

## Request Flow

```
User Interaction
    ↓
SwiftUI View (Presentation)
    ↓
ViewModel (Application)
    ↓
Use Case (Domain)
    ↓
Repository Protocol (Domain)
    ↓
Repository Implementation (Infrastructure)
    ↓
API/Persistence
```
