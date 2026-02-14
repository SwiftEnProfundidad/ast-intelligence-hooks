---
name: windsurf-rules-android
description: Reglas Android/Kotlin/Compose del proyecto. Usar en cambios Android.
---
---
alwaysApply: true
---

# Android Rules - Kotlin/Jetpack Compose

## ANTES de implementar CUALQUIER cosa:

### Fundamentos (heredados de goldrules.md):
✅ **Siempre responder en español**
✅ **Actúa como un Arquitecto de Soluciones y Software Designer**
✅ **Seguir siempre flujo BDD->TDD** - Feature files → Specs (JUnit5, Espresso) → Implementación
✅ **En producción ni un mocks ni un spies** - Todo real de APIs y persistencia (Room, SharedPreferences)
✅ **No poner comentarios en el código** - Nombres autodescriptivos
✅ **Analizar estructura existente** - Módulos, interfaces, dependencias, Gradle
✅ **Verificar que NO viole SOLID** (SRP, OCP, LSP, ISP, DIP)
✅ **No Singleton** - Usar Inyección de Dependencias (Hilt/Dagger)
✅ **Seguir Clean Architecture** - Domain → Data → Presentation
✅ **Early returns** - Guard clauses, evitar if/else anidados
✅ **Comprobar que compile ANTES de sugerir** - Gradle build sin errores

### Kotlin 100%:
✅ **NO Java en código nuevo** - Kotlin para todo
✅ **Kotlin 1.9+** - Usar features modernas del lenguaje
✅ **Coroutines** - async/await, NO callbacks
✅ **Flow** - Streams de datos reactivos
✅ **Sealed classes** - Para estados y resultados (Success, Error, Loading)
✅ **Data classes** - Para DTOs y modelos
✅ **Extension functions** - Extender funcionalidad sin herencia
✅ **Scope functions** - let, run, apply, also, with apropiadamente
✅ **Null safety** - NO !! (force unwrap), usar ?, ?:, let, requireNotNull

### Jetpack Compose (UI Declarativo):
✅ **Compose 100%** - NO XML layouts en código nuevo
✅ **Composable functions** - @Composable para UI
✅ **State hoisting** - Elevar estado al nivel apropiado
✅ **remember** - Para mantener estado entre recomposiciones
✅ **rememberSaveable** - Sobrevive process death
✅ **derivedStateOf** - Cálculos derivados de state
✅ **LaunchedEffect** - Side effects con lifecycle
✅ **DisposableEffect** - Cleanup cuando Composable sale de composición
✅ **Recomposition** - Composables deben ser idempotentes
✅ **Modifier** - Orden importa (padding antes que background)
✅ **Preview** - @Preview para ver UI sin correr app

### Material Design 3:
✅ **Material 3 components** - Button, Card, TextField, etc.
✅ **Theme** - Color scheme, typography, shapes
✅ **Dark theme** - Soportar desde día 1 (isSystemInDarkTheme())
✅ **Adaptive layouts** - Responsive design (WindowSizeClass)
✅ **Motion** - Animaciones consistentes con Material guidelines
✅ **Accessibility** - semantics, contentDescription

### Architecture (MVVM + Clean):
✅ **MVVM** - Model-View-ViewModel
✅ **Single Activity** - Múltiples Composables/Fragments, no Activities
✅ **Navigation Component** - Jetpack Navigation para Compose
✅ **ViewModel** - androidx.lifecycle.ViewModel
✅ **StateFlow/SharedFlow** - Para exponer estado del ViewModel
✅ **Repository pattern** - Abstraer acceso a datos
✅ **Use Cases** - Lógica de negocio encapsulada
✅ **Mapper** - Convertir entre DTOs y domain models

### Arquitectura Feature-First + DDD + Clean + Event-Driven (Android):
✅ **Feature-first** - Cada feature es un Bounded Context, aislado
✅ **Clean por feature** - presentation → application → domain, data → domain
✅ **DDD** - entidades, value objects, repositorios, eventos de dominio
✅ **Navegación event-driven** cuando el modelo crezca (event bus + router)
✅ **Shared Kernel** - Tipos mínimos compartidos entre features

```
apps/android/
  features/
    auth/
      domain/
      application/
      data/
      presentation/
      navigation/
  shared/
    kernel/
    design-system/
  navigation/
    event-bus/
    routes/
```

### Clean Architecture en Android:

```
app/
  domain/
    model/                 # Order, User (domain models)
    repository/            # OrderRepository interface
    usecase/               # CreateOrderUseCase
  data/
    remote/
      api/                 # Retrofit API service
      dto/                 # API response DTOs
    local/
      dao/                 # Room DAOs
      entity/              # Room entities
    repository/            # OrderRepositoryImpl
    mapper/                # DTO ↔ Domain mappers
  presentation/
    ui/
      orders/
        OrdersScreen.kt    # Composable
        OrdersViewModel.kt # ViewModel
      components/          # Reusable Composables
    navigation/            # Navigation graph
    theme/                 # Material 3 theme
  di/                      # Hilt modules
```

### Dependency Injection (Hilt):
✅ **Hilt** - DI framework (NO manual factories)
✅ **@HiltAndroidApp** - Application class
✅ **@AndroidEntryPoint** - Activity, Fragment, ViewModel
✅ **@Inject constructor** - Constructor injection
✅ **@Module + @InstallIn** - Provide dependencies
✅ **@Provides** - Para interfaces o third-party
✅ **@Binds** - Para implementaciones de interfaces (más eficiente)
✅ **@Singleton** - Solo para recursos globales (DB, API client)
✅ **@ViewModelScoped** - Para dependencias de ViewModel

### Coroutines (Async):
✅ **suspend functions** - Para operaciones async
✅ **viewModelScope** - Scope de ViewModel, cancelado automáticamente
✅ **lifecycleScope** - Scope de Activity/Fragment
✅ **Dispatchers** - Main (UI), IO (network/disk), Default (CPU)
✅ **withContext** - Cambiar dispatcher
✅ **async/await** - Paralelismo
✅ **supervisorScope** - Errores no cancelan otros jobs
✅ **try-catch** - Manejo de errores en coroutines

### Flow (Reactive Streams):
✅ **StateFlow** - Hot stream, siempre tiene valor, para estado
✅ **SharedFlow** - Hot stream, puede no tener valor, para eventos
✅ **Flow builders** - flow { emit() }, flowOf(), asFlow()
✅ **Operators** - map, filter, combine, flatMapLatest, catch
✅ **collect** - Terminal operator para consumir Flow
✅ **collectAsState** - En Compose para observar Flow
✅ **stateIn** - Convertir cold Flow a hot StateFlow

### Networking (Retrofit):
✅ **Retrofit** - REST client
✅ **OkHttp** - HTTP client con interceptors
✅ **Moshi/Gson** - JSON serialization (Moshi preferido)
✅ **suspend functions** - En API service
✅ **Interceptors** - Logging, auth tokens, error handling
✅ **Error handling** - Custom sealed class Result<T>
✅ **Retry logic** - Exponential backoff
✅ **Certificate pinning** - SSL pinning para seguridad

### Persistence (Room):
✅ **Room** - SQLite wrapper type-safe
✅ **@Entity** - Tablas
✅ **@Dao** - Data Access Objects con suspend functions
✅ **@Database** - Database class abstracta
✅ **Flow<T>** - Queries observables
✅ **@TypeConverter** - Para tipos custom (Date, List, etc.)
✅ **Migrations** - Versionado de schema
✅ **@Transaction** - Para operaciones multi-query

### State Management:
✅ **ViewModel** - Sobrevive configuration changes
✅ **StateFlow** - Estado mutable observable
✅ **UiState sealed class** - Loading, Success, Error states
✅ **Single source of truth** - ViewModel es la fuente
✅ **Immutable state** - data class + copy()
✅ **State hoisting** - Elevar estado en Compose

### Navigation:
✅ **Navigation Compose** - androidx.navigation:navigation-compose
✅ **NavHost** - Container de navegación
✅ **NavController** - Controla navegación
✅ **Routes** - Strings para destinos
✅ **Arguments** - Pasar datos entre pantallas
✅ **Deep links** - Soporte para URLs
✅ **Bottom navigation** - Material 3 NavigationBar

### Image Loading:
✅ **Coil** - Async image loading (recomendado para Compose)
✅ **Glide** - Alternativa, más maduro
✅ **Caching** - Memory + Disk cache
✅ **Transformations** - Resize, crop, blur
✅ **Placeholders** - Mientras carga
✅ **Error handling** - Fallback images

### Testing:
✅ **JUnit5** - Framework de testing (preferido sobre JUnit4)
✅ **MockK** - Mocking library para Kotlin
✅ **Turbine** - Testing de Flows
✅ **Compose UI Test** - Testing de Composables
✅ **Espresso** - UI testing (si usas Fragments)
✅ **Robolectric** - Unit tests con Android framework
✅ **Truth** - Assertions más legibles
✅ **Coroutines Test** - runTest, TestDispatcher
✅ **Coverage >80%** - Objetivo 95% en lógica crítica

### Testing Structure:
✅ **test/** - Unit tests (JVM)
✅ **androidTest/** - Instrumented tests (Device/Emulator)
✅ **AAA pattern** - Arrange, Act, Assert
✅ **Given-When-Then** - BDD style
✅ **Test doubles** - Fakes > Mocks para repositories

### Ejemplos mínimos:
```kotlin
viewModelScope.launch {
  val result = repository.load()
  _uiState.value = uiState.value.copy(data = result)
}
```

```kotlin
@Composable
fun Screen(uiState: UiState) {
  LazyColumn {
    items(uiState.items) { item -> Text(item.title) }
  }
}
```

```kotlin
@HiltViewModel
class ScreenViewModel @Inject constructor(
  private val repository: Repository
) : ViewModel()
```

### Security:
✅ **EncryptedSharedPreferences** - Para datos sensibles
✅ **Keystore** - Claves criptográficas
✅ **SafetyNet/Play Integrity** - Verificar integridad del dispositivo
✅ **Root detection** - Prevenir uso en dispositivos rooted
✅ **ProGuard/R8** - Ofuscación de código en release
✅ **Network Security Config** - Certificate pinning
✅ **Biometric auth** - BiometricPrompt API

### Performance:
✅ **LazyColumn/LazyRow** - Virtualización de listas
✅ **Paging 3** - Paginación de datos grandes
✅ **WorkManager** - Background tasks
✅ **Baseline Profiles** - Optimización de startup
✅ **App startup** - androidx.startup para lazy init
✅ **LeakCanary** - Detección de memory leaks
✅ **Android Profiler** - CPU, Memory, Network profiling

### Compose Performance:
✅ **Stability** - Composables estables recomponen menos
✅ **remember** - Evitar recrear objetos
✅ **derivedStateOf** - Cálculos caros solo cuando cambia input
✅ **LaunchedEffect keys** - Controlar cuándo se relanza effect
✅ **Immutable collections** - kotlinx.collections.immutable
✅ **Skip recomposition** - Parámetros inmutables o estables

### Accessibility:
✅ **TalkBack** - Screen reader de Android
✅ **contentDescription** - Para imágenes y botones
✅ **semantics** - En Compose para accesibilidad
✅ **Touch targets** - Mínimo 48dp
✅ **Color contrast** - WCAG AA mínimo
✅ **Text scaling** - Soportar font scaling del sistema

### Localization (i18n):
✅ **strings.xml** - Por idioma (values-es, values-en)
✅ **Plurals** - values/plurals.xml
✅ **RTL support** - start/end en lugar de left/right
✅ **String formatting** - %1$s, %2$d para argumentos
✅ **DateFormat** - Fechas localizadas
✅ **NumberFormat** - Números, monedas localizados

### Gradle (Build):
✅ **Kotlin DSL** - build.gradle.kts (preferido sobre Groovy)
✅ **Version catalogs** - libs.versions.toml para dependencias
✅ **buildSrc** - Para lógica compartida de build
✅ **Build types** - debug, release, staging
✅ **Product flavors** - Para variantes de app
✅ **Build variants** - Combinación de build type + flavor
✅ **Dependency management** - Versiones consistentes

### Multi-module:
✅ **Feature modules** - :feature:orders, :feature:users
✅ **Core modules** - :core:network, :core:database, :core:ui
✅ **App module** - Composición final
✅ **Clear dependencies** - Feature → Core, NO Feature → Feature
✅ **Dynamic features** - Para app bundles grandes (opcional)

### CI/CD:
✅ **GitHub Actions / GitLab CI** - Pipelines
✅ **Gradle tasks** - ./gradlew assembleDebug, test
✅ **Lint** - ./gradlew lint (warnings = errores)
✅ **Detekt** - Static analysis para Kotlin
✅ **Firebase App Distribution** - Beta testing
✅ **Play Console** - Production deployment

### Logging:
✅ **Timber** - Logging library
✅ **Log levels** - e (error), w (warn), i (info), d (debug)
✅ **NO logs en producción** - if (BuildConfig.DEBUG) Timber.d()
✅ **Crashlytics** - Firebase para crash reporting
✅ **Analytics** - Firebase Analytics o custom

### Configuration:
✅ **BuildConfig** - Constantes en tiempo de compilación
✅ **gradle.properties** - Configuración de build
✅ **local.properties** - API keys (NO subir a git)
✅ **secrets-gradle-plugin** - Para API keys seguras
✅ **Environment variables** - Para CI/CD

### Anti-patterns a EVITAR:
❌ **Java en código nuevo** - Solo Kotlin
❌ **XML layouts** - Usar Jetpack Compose
❌ **Force unwrapping (!!)** - Usar ?, ?:, let
❌ **Context leaks** - No referencias a Activity en objetos long-lived
❌ **God Activities** - Single Activity + Composables
❌ **Hardcoded strings** - Usar strings.xml
❌ **AsyncTask** - Deprecated, usar Coroutines
❌ **RxJava en nuevo código** - Usar Flow
❌ **findViewById** - View Binding o Compose
❌ **Singletons everywhere** - Usar Hilt DI

### Jetpack Libraries:
✅ **ViewModel** - androidx.lifecycle:lifecycle-viewmodel-ktx
✅ **Navigation** - androidx.navigation:navigation-compose
✅ **Room** - androidx.room:room-ktx
✅ **WorkManager** - androidx.work:work-runtime-ktx
✅ **Paging** - androidx.paging:paging-compose
✅ **DataStore** - androidx.datastore:datastore-preferences (reemplazo de SharedPreferences)
✅ **Hilt** - com.google.dagger:hilt-android
✅ **Compose BOM** - androidx.compose:compose-bom

### Específicas para RuralGO Mobile:
✅ **Compartir DTOs con backend** - TypeScript → Kotlin codegen (quicktype, OpenAPI)
✅ **Repository pattern** - OrdersRep
