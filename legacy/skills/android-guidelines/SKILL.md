---
name: android-guidelines
description: Comprehensive Android development guide for Kotlin/Jetpack Compose applications using Hilt for dependency injection. Use when creating Composables, ViewModels, use cases, repositories, network layers, or working with Kotlin code, Jetpack Compose components, Room database, Coroutines, Flow, or Android-specific features. Covers Clean Architecture (Domain → Data → Presentation), MVVM pattern, Material Design 3, and testing strategies.
---

# Android Development Guidelines

## Purpose

Establish consistency and best practices across Android applications using Kotlin/Jetpack Compose with Hilt, following Clean Architecture principles.

## When to Use This Skill

Automatically activates when working on:
- Creating or modifying Jetpack Compose screens
- Building ViewModels and use cases
- Implementing repositories and network layers
- Working with Coroutines and Flow
- Android-specific features (Room, SharedPreferences, Keychain, etc.)
- Navigation with Navigation Compose
- Android testing and refactoring
- Clean Architecture patterns

---

## Quick Start

### New Android Feature Checklist

- [ ] **Screen**: Jetpack Compose screen
- [ ] **Use Case**: Business logic in domain/usecase/
- [ ] **Repository**: Interface in domain/repository/, implementation in data/repository/
- [ ] **Model**: Domain model in domain/model/
- [ ] **ViewModel**: Presentation/ui/{feature}/ViewModel
- [ ] **Tests**: Unit + integration tests
- [ ] **Error Handling**: Sealed class Result<T>
- [ ] **No empty catch**: Silencing errors in tooling is forbidden (AST: common.error.empty_catch)

### New Module Checklist

- [ ] Directory structure (see [architecture-overview.md](resources/architecture-overview.md))
- [ ] Repository interface in domain/repository/
- [ ] Repository implementation in data/repository/
- [ ] Use cases in domain/usecase/
- [ ] ViewModels in presentation/ui/{feature}/
- [ ] Composables in presentation/ui/{feature}/
- [ ] Hilt modules in di/
- [ ] Testing setup

---

## Architecture Overview

### Clean Architecture Layers

```
User Interaction
    ↓
Presentation (Jetpack Compose, ViewModels)
    ↓
Domain (Entities, Use Cases, Repository Interfaces)
    ↓
Data (Repository Implementations, Remote, Local)
```

**Key Principle:** Dependencies point inward. Domain has no dependencies.

See [architecture-overview.md](resources/architecture-overview.md) for complete details.

---

## Directory Structure

```
app/
├── domain/
│   ├── model/                 # Order, User (domain models)
│   ├── repository/            # OrderRepository interface
│   └── usecase/               # CreateOrderUseCase
├── data/
│   ├── remote/
│   │   ├── api/               # Retrofit API service
│   │   └── dto/               # API response DTOs
│   ├── local/
│   │   ├── dao/               # Room DAOs
│   │   └── entity/            # Room entities
│   ├── repository/            # OrderRepositoryImpl
│   └── mapper/                # DTO ↔ Domain mappers
├── presentation/
│   ├── ui/
│   │   ├── orders/
│   │   │   ├── OrdersScreen.kt    # Composable
│   │   │   └── OrdersViewModel.kt  # ViewModel
│   │   └── components/         # Reusable Composables
│   ├── navigation/            # Navigation graph
│   └── theme/                 # Material 3 theme
└── di/                        # Hilt modules
```

**Naming Conventions:**
- Screens: `PascalCase + Screen` - `OrdersListScreen.kt`
- ViewModels: `PascalCase + ViewModel` - `OrdersListViewModel.kt`
- Use Cases: `PascalCase + UseCase` - `CreateOrderUseCase.kt`
- Repositories: `PascalCase + Repository` - `OrdersRepository.kt`
- Interfaces: `I + PascalCase` - `IOrdersRepository.kt` (or just `OrdersRepository`)

---

## Core Principles

### 1. Jetpack Compose First (NO XML layouts)

```kotlin
// ✅ Jetpack Compose (preferred)
@Composable
fun OrdersListScreen(
    viewModel: OrdersListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    when (val state = uiState) {
        is UiState.Loading -> LoadingIndicator()
        is UiState.Success -> OrdersList(orders = state.orders)
        is UiState.Error -> ErrorMessage(state.message)
    }
}

// ❌ XML layouts (avoid in new code)
// activity_orders_list.xml - NO
```

### 2. Clean Architecture Layers

```kotlin
// Domain (no dependencies)
interface OrdersRepository {
    suspend fun getOrders(): Result<List<Order>>
}

// Data (implements domain interface)
class OrdersRepositoryImpl @Inject constructor(
    private val api: OrdersApi,
    private val dao: OrdersDao
) : OrdersRepository {
    override suspend fun getOrders(): Result<List<Order>> {
        return try {
            val orders = api.getOrders()
            dao.insertAll(orders.map { it.toEntity() })
            Result.success(orders.map { it.toDomain() })
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// Domain Use Case
class GetOrdersUseCase @Inject constructor(
    private val repository: OrdersRepository
) {
    suspend operator fun invoke(): Result<List<Order>> {
        return repository.getOrders()
    }
}

// Presentation (Composable + ViewModel)
@Composable
fun OrdersListScreen(
    viewModel: OrdersListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    // UI rendering
}

class OrdersListViewModel @Inject constructor(
    private val getOrdersUseCase: GetOrdersUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow<UiState<List<Order>>>(UiState.Loading)
    val uiState: StateFlow<UiState<List<Order>>> = _uiState.asStateFlow()
    
    init {
        loadOrders()
    }
    
    private fun loadOrders() {
        viewModelScope.launch {
            getOrdersUseCase().fold(
                onSuccess = { _uiState.value = UiState.Success(it) },
                onFailure = { _uiState.value = UiState.Error(it.message ?: "Error") }
            )
        }
    }
}
```

### 3. Dependency Injection with Hilt

```kotlin
// Application class
@HiltAndroidApp
class PumukiMockConsumerApplication : Application()

// ViewModel injection
@HiltViewModel
class OrdersListViewModel @Inject constructor(
    private val getOrdersUseCase: GetOrdersUseCase
) : ViewModel()

// Composable injection
@Composable
fun OrdersListScreen(
    viewModel: OrdersListViewModel = hiltViewModel()
)

// Module for providing dependencies
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideOrdersApi(): OrdersApi {
        return Retrofit.Builder()
            .baseUrl("https://api.pumuki-mock-consumer.com/")
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(OrdersApi::class.java)
    }
}
```

### 4. Coroutines and Flow

```kotlin
// ✅ suspend functions
suspend fun getOrders(): Result<List<Order>>

// ✅ Flow for reactive streams
fun observeOrders(): Flow<List<Order>> = flow {
    while (true) {
        emit(repository.getOrders())
        delay(5000)
    }
}

// ✅ StateFlow for UI state
private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
val uiState: StateFlow<UiState> = _uiState.asStateFlow()

// ✅ Collect in Composable
val uiState by viewModel.uiState.collectAsState()
```

### 5. Material Design 3

```kotlin
@Composable
fun OrdersListScreen() {
    MaterialTheme {
        Scaffold(
            topBar = {
                TopAppBar(title = { Text("Orders") })
            }
        ) { padding ->
            LazyColumn(modifier = Modifier.padding(padding)) {
                items(orders) { order ->
                    OrderCard(order = order)
                }
            }
        }
    }
}
```

### 6. Testing Required

```kotlin
@Test
fun `GetOrdersUseCase returns success when repository succeeds`() = runTest {
    val mockRepository = mockk<OrdersRepository>()
    coEvery { mockRepository.getOrders() } returns Result.success(orders)
    
    val useCase = GetOrdersUseCase(mockRepository)
    val result = useCase()
    
    assertTrue(result.isSuccess)
    assertEquals(orders, result.getOrNull())
}
```

---

## Common Imports

```kotlin
// Jetpack Compose
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

// ViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope

// Coroutines
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

// Hilt
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

// Room
import androidx.room.*

// Retrofit
import retrofit2.http.*
```

---

## Quick Reference

### Jetpack Compose Patterns

- **Composables**: `@Composable fun ComponentName()`
- **State**: `remember`, `rememberSaveable`, `derivedStateOf`
- **Effects**: `LaunchedEffect`, `DisposableEffect`
- **ViewModels**: `@HiltViewModel class ViewModelName : ViewModel()`

### Coroutines Patterns

- **Suspend Functions**: `suspend fun name(): Result<T>`
- **Flow**: `flow { emit(value) }`
- **StateFlow**: `MutableStateFlow` → `asStateFlow()`
- **Collect**: `collectAsState()` in Composables

### Hilt Patterns

- **Application**: `@HiltAndroidApp`
- **ViewModel**: `@HiltViewModel`
- **Composable**: `hiltViewModel()`
- **Module**: `@Module @InstallIn`

---

## Security

✅ **EncryptedSharedPreferences** - Para datos sensibles
✅ **Keystore** - Cryptographic keys
✅ **SafetyNet/Play Integrity** - Verificar integridad del dispositivo
✅ **Root detection** - Prevenir uso en dispositivos rooted
✅ **ProGuard/R8** - Code obfuscation in release
✅ **Network Security Config** - Certificate pinning
✅ **Biometric auth** - BiometricPrompt API

## Accessibility

✅ **TalkBack** - Screen reader de Android
✅ **contentDescription** - For images and buttons
✅ **semantics** - In Compose for accessibility
✅ **Touch targets** - Minimum 48dp
✅ **Color contrast** - WCAG AA minimum
✅ **Text scaling** - Soportar font scaling del sistema

## Localization (i18n)

✅ **strings.xml** - Por idioma (values-es, values-en)
✅ **Plurals** - values/plurals.xml
✅ **RTL support** - start/end en lugar de left/right
✅ **String formatting** - `%1$s`, `%2$d` for arguments
✅ **DateFormat** - Fechas localizadas
✅ **NumberFormat** - Localized numbers and currencies

## Performance

✅ **LazyColumn/LazyRow** - List virtualization
✅ **Paging 3** - Pagination for large datasets
✅ **WorkManager** - Background tasks
✅ **Baseline Profiles** - Startup optimization
✅ **App startup** - `androidx.startup` for lazy initialization
✅ **LeakCanary** - Memory leak detection
✅ **Android Profiler** - CPU, Memory, Network profiling

## Compose Performance

✅ **Stability** - Composables estables recomponen menos
✅ **remember** - Evitar recrear objetos
✅ **derivedStateOf** - Expensive calculations only when input changes
✅ **LaunchedEffect keys** - Control when effects relaunch
✅ **Immutable collections** - kotlinx.collections.immutable
✅ **Skip recomposition** - Immutable or stable parameters

## Advanced Topics

See [advanced-topics.md](resources/advanced-topics.md) for:
- Gradle (Build)
- Multi-module
- CI/CD
- Logging
- Configuration

## Anti-Patterns to Avoid

❌ XML layouts in new code
❌ Force unwrapping (!!) - use ?, ?:, let
❌ Context leaks - no Activity references in long-lived objects
❌ God Activities - Single Activity + Composables
❌ Hardcoded strings - use strings.xml
❌ AsyncTask - deprecated, use Coroutines
❌ RxJava in new code - use Flow
❌ Singletons everywhere - use Hilt DI
❌ Java in new code - Kotlin only
❌ findViewById - View Binding o Compose
❌ Magic numbers - Use named constants

---

## Navigation Guide

| Need to... | Read this |
|------------|-----------|
| Understand architecture | [architecture-overview.md](resources/architecture-overview.md) |
| Create Composables | [compose-patterns.md](resources/compose-patterns.md) |
| Implement use cases | [use-cases-guide.md](resources/use-cases-guide.md) |
| Repository pattern | [repositories-guide.md](resources/repositories-guide.md) |
| Handle errors | [error-handling.md](resources/error-handling.md) |
| Network access | [networking-patterns.md](resources/networking-patterns.md) |
| Write tests | [testing-guide.md](resources/testing-guide.md) |
| Advanced topics | [advanced-topics.md](resources/advanced-topics.md) |
| See examples | [complete-examples.md](resources/complete-examples.md) |

---

## Resource Files

### [architecture-overview.md](resources/architecture-overview.md)
Clean Architecture layers, dependency direction, separation of concerns

### [compose-patterns.md](resources/compose-patterns.md)
Jetpack Compose screens, state management, Material Design 3

### [use-cases-guide.md](resources/use-cases-guide.md)
Business logic orchestration, error handling

### [repositories-guide.md](resources/repositories-guide.md)
Repository interfaces, implementations, dependency injection

### [error-handling.md](resources/error-handling.md)
Sealed class Result<T>, error propagation

### [networking-patterns.md](resources/networking-patterns.md)
Retrofit, Coroutines, error handling

### [testing-guide.md](resources/testing-guide.md)
Unit/integration tests, MockK, coverage

### [advanced-topics.md](resources/advanced-topics.md)
Gradle, multi-module, CI/CD, logging, configuration

### [complete-examples.md](resources/complete-examples.md)
Full examples, refactoring guide

---

## Related Skills

- **backend-guidelines** - Backend development patterns
- **frontend-guidelines** - Frontend development patterns
- **ios-guidelines** - iOS development patterns
- **skill-developer** - Meta-skill for creating and managing skills

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**Progressive Disclosure**: 8 resource files ✅
