---
name: ios-guidelines
description: Comprehensive iOS development guide for Swift/SwiftUI applications using TCA (The Composable Architecture). Use when creating views, view models, use cases, repositories, network layers, or working with Swift code, SwiftUI components, TCA navigation, async/await patterns, or iOS-specific features. Covers Clean Architecture (Domain → Application → Infrastructure → Presentation), Protocol-Oriented Programming, Value Types, Memory Management, and testing strategies.
---

# iOS Development Guidelines

## Purpose

Establish consistency and best practices across iOS applications using Swift/SwiftUI with TCA (The Composable Architecture), following Clean Architecture principles.

## When to Use This Skill

Automatically activates when working on:
- Creating or modifying Swift/SwiftUI views
- Building view models and use cases
- Implementing repositories and network layers
- Working with async/await and concurrency
- iOS-specific features (Keychain, Core Data, etc.)
- Navigation with TCA
- iOS testing and refactoring
- Clean Architecture patterns

---

## Quick Start

### New iOS Feature Checklist

- [ ] **View**: SwiftUI view with TCA integration
- [ ] **Use Case**: Business logic in Domain/UseCases/
- [ ] **Repository**: Protocol in Domain/Repositories/, implementation in Infrastructure/
- [ ] **Entity**: Domain model in Domain/Entities/
- [ ] **ViewModel**: Application/ViewModels/ (if needed)
- [ ] **Tests**: Unit + integration tests
- [ ] **Error Handling**: Custom Error enum
- [ ] **No empty catch**: Empty `catch` blocks are forbidden (AST: common.error.empty_catch)

### New Module Checklist

- [ ] Directory structure (see [architecture-overview.md](resources/architecture-overview.md))
- [ ] Repository protocol in Domain/Repositories/
- [ ] Repository implementation in Infrastructure/
- [ ] Use cases in Domain/UseCases/
- [ ] ViewModels in Application/ViewModels/
- [ ] Views in Presentation/Views/
- [ ] Testing setup

---

## Architecture Overview

### Clean Architecture Layers

```
User Interaction
    ↓
Presentation (SwiftUI Views, TCA)
    ↓
Application (ViewModels, Coordinators)
    ↓
Domain (Entities, Use Cases, Repository Protocols)
    ↓
Infrastructure (Repository Implementations, Network, Persistence)
```

**Key Principle:** Dependencies point inward. Domain has no dependencies.

See [architecture-overview.md](resources/architecture-overview.md) for complete details.

---

## Directory Structure

```
apps/ios-mobile/
├── Domain/
│   ├── Entities/              # Business models (Order, User, Store)
│   ├── UseCases/              # Business logic (CreateOrderUseCase)
│   └── Repositories/          # Protocols (OrdersRepositoryProtocol)
├── Application/
│   ├── ViewModels/            # ViewModels (ObservableObject)
│   └── Coordinators/          # Navigation logic (TCA)
├── Infrastructure/
│   ├── Network/
│   │   ├── API/               # API client (URLSession)
│   │   └── Repositories/      # Repository implementations
│   └── Persistence/
│       ├── CoreData/          # Core Data stack
│       ├── Keychain/          # Secure storage
│       └── UserDefaults/      # Simple key-value
└── Presentation/
    ├── Views/                 # SwiftUI Views
    └── Components/            # Reusable UI components
```

**Naming Conventions:**
- Views: `PascalCase + View` - `OrdersListView.swift`
- ViewModels: `PascalCase + ViewModel` - `OrdersListViewModel.swift`
- Use Cases: `PascalCase + UseCase` - `CreateOrderUseCase.swift`
- Repositories: `PascalCase + Repository` - `OrdersRepository.swift`
- Protocols: `PascalCase + Protocol` - `OrdersRepositoryProtocol.swift`

---

## Core Principles

### 1. SwiftUI First (UIKit Legacy/Necesario)

```swift
// ✅ SwiftUI (preferred)
struct OrdersListView: View {
    var body: some View {
        List(orders) { order in
            OrderRow(order: order)
        }
    }
}

// ✅ UIKit (legacy/required - only when strictly necessary)
class OrdersViewController: UIViewController {
    // Programmatic UI, no Storyboards
}
```

### 2. Clean Architecture Layers

```swift
// Domain (no dependencies)
protocol OrdersRepositoryProtocol {
    func fetchOrders() async throws -> [Order]
}

// Infrastructure (implements domain protocol)
class OrdersRepository: OrdersRepositoryProtocol {
    private let apiClient: APIClient
    
    func fetchOrders() async throws -> [Order] {
        return try await apiClient.get("/orders")
    }
}

// Application (use cases)
class GetOrdersUseCase {
    private let repository: OrdersRepositoryProtocol
    
    func execute() async throws -> [Order] {
        return try await repository.fetchOrders()
    }
}

// Presentation (SwiftUI view)
struct OrdersListView: View {
    @StateObject private var viewModel = OrdersListViewModel()
    
    var body: some View {
        List(viewModel.orders) { order in
            OrderRow(order: order)
        }
    }
}
```

### 3. Protocol-Oriented Programming

```swift
// Protocol in Domain
protocol NetworkServiceProtocol {
    func request<T: Decodable>(_ endpoint: String) async throws -> T
}

// Implementation in Infrastructure
class NetworkService: NetworkServiceProtocol {
    func request<T: Decodable>(_ endpoint: String) async throws -> T {
        // Implementation
    }
}
```

### 4. Value Types Preferred

```swift
// ✅ struct (preferred)
struct Order {
    let id: String
    let status: OrderStatus
}

// ✅ class (only when needed)
class OrderViewModel: ObservableObject {
    @Published var orders: [Order] = []
}
```

### 5. Memory Management

```swift
// ✅ [weak self] in closures
Task { [weak self] in
    guard let self = self else { return }
    await self.loadData()
}

// ✅ No force unwrapping
guard let order = orders.first else { return }
```

### 6. Async/Await (No Completion Handlers)

```swift
// ✅ async/await
func fetchOrders() async throws -> [Order] {
    return try await repository.fetchOrders()
}

// ❌ Completion handlers (avoid in new code)
func fetchOrders(completion: @escaping (Result<[Order], Error>) -> Void) {
    // Avoid
}
```

### 7. Testing Required

```swift
@MainActor
func testGetOrdersUseCase() async throws {
    let useCase = GetOrdersUseCase(repository: mockRepository)
    let orders = try await useCase.execute()
    XCTAssertEqual(orders.count, 5)
}
```

---

## Common Imports

```swift
// SwiftUI
import SwiftUI

// Foundation
import Foundation

// Combine (if needed)
import Combine

// TCA (if using)
import ComposableArchitecture

// Domain
import Domain

// Infrastructure
import Infrastructure
```

---

## Quick Reference

### SwiftUI Patterns

- **Views**: `struct ViewName: View`
- **ViewModels**: `class ViewModelName: ObservableObject`
- **State**: `@State`, `@StateObject`, `@ObservedObject`
- **Binding**: `@Binding`

### Memory Management

- **Weak**: `[weak self]` in closures that may outlive self
- **Unowned**: `[unowned self]` only if self always exists
- **No Force Unwrapping**: Use `guard let` or `if let`

### Async/Await

- **Async Functions**: `func name() async throws -> Type`
- **Task**: `Task { await function() }`
- **@MainActor**: UI updates on main thread

---

## Security

✅ **Keychain** - Passwords, tokens (NO UserDefaults)
✅ **SSL pinning** - Prevenir man-in-the-middle
✅ **Jailbreak detection** - Optional for critical applications
✅ **App Transport Security (ATS)** - HTTPS por defecto
✅ **Biometric auth** - Face ID, Touch ID (LocalAuthentication)
✅ **Secure enclave** - For cryptographic keys
✅ **Obfuscation** - Sensitive strings in code

## Accessibility

✅ **VoiceOver** - Test with a screen reader
✅ **Dynamic Type** - Automatic font scaling
✅ **Accessibility labels** - .accessibilityLabel()
✅ **Traits** - .accessibilityAddTraits(.isButton)
✅ **Reduce motion** - Respetar preferencias del usuario
✅ **Color contrast** - WCAG AA minimum

## Localization (i18n)

✅ **NSLocalizedString** - Strings traducibles
✅ **Localizable.strings** - Archivos por idioma
✅ **Stringsdict** - Para plurales
✅ **Base internationalization** - Base.lproj
✅ **RTL support** - Right-to-left support for Arabic/Hebrew
✅ **NumberFormatter** - Localized number/currency formatting
✅ **DateFormatter** - Fechas localizadas

## Performance

✅ **Instruments** - Time Profiler, Allocations, Leaks
✅ **Lazy loading** - LazyVStack, on-demand data
✅ **Image optimization** - Resize, compress, cache
✅ **Background threads** - Do not block the main thread
✅ **Main thread blocking detection** - Detects blocking synchronous operations
✅ **Watchdog prevention** - Previene app kill por watchdog (>5s freeze)
✅ **Reuse cells** - UITableView/UICollectionView
✅ **Memoization** - Cache expensive computations

## Code Organization

✅ **SPM (Swift Package Manager)** - Modularization
✅ **Feature modules** - Orders, Users, Auth as packages
✅ **Extensions** - Group by functionality, separate files
✅ **MARK: -** - Organize code inside files
✅ **File naming** - PascalCase for types, camelCase for files

## CI/CD

✅ **Fastlane** - Build, test, and deployment automation
✅ **xcodebuild** - CLI for builds
✅ **TestFlight** - Beta distribution
✅ **GitHub Actions / Bitrise** - CI/CD pipelines

## Anti-Patterns to Avoid

❌ Force unwrapping (!) except IBOutlets
❌ Completion handlers in new code
❌ Singletons (use dependency injection)
❌ Business logic in views
❌ Direct API calls in views
❌ Missing error handling
❌ Retain cycles
❌ Massive View Controllers (>300 lines)
❌ Large storyboards (merge conflicts, slowness)
❌ Magic numbers (use named constants)
❌ Ignoring warnings (`warnings = future errors`)

---

## Navigation Guide

| Need to... | Read this |
|------------|-----------|
| Understand architecture | [architecture-overview.md](resources/architecture-overview.md) |
| Create views | [swiftui-patterns.md](resources/swiftui-patterns.md) |
| Implement use cases | [use-cases-guide.md](resources/use-cases-guide.md) |
| Repository pattern | [repositories-guide.md](resources/repositories-guide.md) |
| Handle errors | [error-handling.md](resources/error-handling.md) |
| Network access | [networking-patterns.md](resources/networking-patterns.md) |
| Write tests | [testing-guide.md](resources/testing-guide.md) |
| See examples | [complete-examples.md](resources/complete-examples.md) |

---

## Resource Files

### [architecture-overview.md](resources/architecture-overview.md)
Clean Architecture layers, dependency direction, separation of concerns

### [swiftui-patterns.md](resources/swiftui-patterns.md)
SwiftUI views, state management, TCA integration

### [use-cases-guide.md](resources/use-cases-guide.md)
Business logic orchestration, error handling

### [repositories-guide.md](resources/repositories-guide.md)
Repository protocols, implementations, dependency injection

### [error-handling.md](resources/error-handling.md)
Custom Error enums, error propagation

### [networking-patterns.md](resources/networking-patterns.md)
URLSession, async/await, error handling

### [testing-guide.md](resources/testing-guide.md)
Unit/integration tests, mocking, coverage

### [complete-examples.md](resources/complete-examples.md)
Full examples, refactoring guide

---

## Related Skills

- **backend-guidelines** - Backend development patterns
- **frontend-guidelines** - Frontend development patterns
- **android-guidelines** - Android development patterns
- **skill-developer** - Meta-skill for creating and managing skills

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**Progressive Disclosure**: 8 resource files ✅
