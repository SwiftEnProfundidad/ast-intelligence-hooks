---
alwaysApply: true
name: apple-dev
description: Directrices de desarrollo nativo Apple para iOS, iPadOS, macOS, watchOS, tvOS y visionOS. Usar cuando se trabaje con Swift, SwiftUI, UIKit, Xcode o cualquier framework del ecosistema Apple. Garantiza código moderno, nativo, sin dependencias de terceros y siguiendo las mejores prácticas actuales de Apple.
globs: ["**/*.swift", "**/*.xcodeproj/**", "**/*.xcworkspace/**"]
---

# Apple Development Guidelines - iOS/iPadOS/macOS/watchOS/tvOS/visionOS

## Versiones y Contexto Temporal

- **Fecha actual de referencia**: Enero 2026
- **iOS 26** (y equivalentes en otras plataformas) lanzado en **septiembre 2025**
- **Lenguaje de diseño actual**: **Liquid Glass** (introducido en iOS 26, sucesor del diseño flat)
- **Swift 6.2** es la versión actual del lenguaje con Approachable Concurrency
- **Xcode 26** es la versión actual del IDE

## Versiones Mínimas de Despliegue

Establecer siempre como deployment target mínimo:

- iOS 18.0 / iPadOS 18.0
- macOS 15.0 (Sequoia)
- watchOS 11.0
- tvOS 18.0
- visionOS 2.0

**Justificación**: Estas versiones tienen parches de seguridad activos y soportan todas las APIs modernas incluyendo Swift 6, concurrencia estricta y las nuevas macros.

## ANTES de implementar CUALQUIER cosa:

### Fundamentos (heredados de goldrules.md):
✅ **Siempre responder en español**
✅ **Actúa como un Arquitecto de Soluciones y Software Designer**
✅ **Seguir siempre flujo BDD->TDD** - Feature files → Specs (XCTest/Quick) → Implementación
✅ **En producción ni un mocks ni un spies** - Todo real de APIs y persistencia (Core Data, UserDefaults, Keychain)
✅ **No poner comentarios en el código** - Nombres autodescriptivos
✅ **Analizar estructura existente** - Módulos, protocolos, dependencias, SPM packages
✅ **Verificar que NO viole SOLID** (SRP, OCP, LSP, ISP, DIP)
✅ **No Singleton** - Usar Inyección de Dependencias (NO compartir instancias globales)
✅ **Seguir Clean Architecture** - Domain → Application → Infrastructure → Presentation
✅ **Guard clauses** - Evitar pyramid of doom, early returns
✅ **Comprobar que compile ANTES de sugerir** - Xcode build sin errores/warnings

### Swift Moderno (Swift 6.2):
✅ **Swift 6.2** - Usar la versión actual con Approachable Concurrency
✅ **async/await OBLIGATORIO** - No completion handlers para código nuevo
✅ **Structured Concurrency** - Task, TaskGroup, actor, AsyncSequence, AsyncStream
✅ **Sendable conformance** - Para tipos thread-safe que cruzan boundaries
✅ **Opaque types** - some View, some Publisher cuando sea apropiado
✅ **Property wrappers** - @State, @Binding, @Observable, custom wrappers
✅ **Result builders** - Para DSLs (SwiftUI ya lo usa)
✅ **Generics** - Reutilizar código type-safe
✅ **Macros** - @Observable, #Preview, custom macros
✅ **Strict Concurrency Checking** - Activar en Complete

```swift
// ✅ Ejemplo: Sendable y actor para estado compartido thread-safe
actor UserSessionManager {
  private var currentUser: User?
  
  func setUser(_ user: User) {
    currentUser = user
  }
  
  func getUser() -> User? {
    currentUser
  }
}

// ✅ Ejemplo: Generics con protocolo de frontera (sin any)
protocol Repository<Entity>: Sendable {
  associatedtype Entity: Sendable
  func fetch(id: String) async throws -> Entity
  func save(_ entity: Entity) async throws
}

struct OrdersRepository<Client: APIClientProtocol>: Repository {
  typealias Entity = Order
  private let client: Client
  
  func fetch(id: String) async throws -> Order {
    try await client.request(.getOrder(id: id))
  }
  
  func save(_ entity: Order) async throws {
    try await client.request(.saveOrder(entity))
  }
}
```

### SwiftUI (Preferido - iOS 17+):
✅ **SwiftUI primero** - UIKit solo cuando sea estrictamente necesario
✅ **Declarativo** - Describe el UI, no cómo construirlo
✅ **@State para local** - Estado privado del view
✅ **@Binding para compartir** - Pasar estado editable a child views
✅ **@Observable (iOS 17+)** - Usar en vez de ObservableObject
✅ **@Bindable** - Para bindings con @Observable
✅ **@Environment** - Para inyección de dependencias y valores del sistema
✅ **NavigationStack + NavigationPath** - Para navegación moderna
✅ **Composición de Views** - Views pequeños, reutilizables
✅ **ViewModifiers nativos primero** - Antes de crear custom ViewModifiers
✅ **PreferenceKeys** - Para comunicación child → parent
✅ **ViewThatFits** - Para layouts adaptativos
✅ **containerRelativeFrame** - Para sizing relativo al contenedor
❌ **Nunca AnyView** - Type erasure innecesario, afecta performance
❌ **GeometryReader con moderación** - Solo cuando sea estrictamente necesario

```swift
// ✅ Ejemplo: ViewModel con @Observable (iOS 17+)
@Observable
final class OrdersViewModel {
  var orders: [Order] = []
  var isLoading = false
  var errorMessage: String?
  
  private let repository: any Repository<Order>
  
  init(repository: any Repository<Order>) {
    self.repository = repository
  }
  
  func loadOrders() async {
    isLoading = true
    defer { isLoading = false }
    
    do {
      orders = try await repository.fetchAll()
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}

// ✅ Ejemplo: View con @Bindable y NavigationStack
struct OrdersListView: View {
  @Bindable var viewModel: OrdersViewModel
  @Environment(\.dismiss) private var dismiss
  
  var body: some View {
    NavigationStack {
      List(viewModel.orders) { order in
        NavigationLink(value: order) {
          OrderRowView(order: order)
        }
      }
      .navigationDestination(for: Order.self) { order in
        OrderDetailView(order: order)
      }
      .navigationTitle(String(localized: "orders.title"))
      .task {
        await viewModel.loadOrders()
      }
    }
  }
}

// ✅ Ejemplo: ViewThatFits para layouts adaptativos
struct AdaptiveButtonsView: View {
  var body: some View {
    ViewThatFits(in: .horizontal) {
      HStack {
        PrimaryButton(title: "Aceptar")
        SecondaryButton(title: "Cancelar")
      }
      VStack {
        PrimaryButton(title: "Aceptar")
        SecondaryButton(title: "Cancelar")
      }
    }
  }
}
```

### UIKit (Legacy/Necesario):
✅ **Programmatic UI** - NO Storyboards/XIBs (mejor control de versiones)
✅ **Auto Layout** - NSLayoutConstraint, SnapKit si es apropiado
✅ **Delegation pattern** - Weak delegates para evitar retain cycles
✅ **Coordinator pattern** - Para navegación compleja
✅ **MVVM** - Model-View-ViewModel, binding con Combine
✅ **UIViewController delgados** - Lógica en ViewModels

### Protocol-Oriented Programming (POP):
✅ **Protocols over Inheritance** - Composición de comportamiento
✅ **Protocol extensions** - Default implementations
✅ **Associated types** - Generics en protocols
✅ **Protocol composition** - Combinar múltiples protocols
✅ **Testability** - Inyectar protocols, no tipos concretos

```swift
// ✅ Ejemplo: Segregación de interfaces (ISP)
protocol TokenSaving: Sendable {
  func saveToken(_ token: String) throws
}

protocol TokenReading: Sendable {
  func getToken() -> String?
}

protocol TokenDeleting: Sendable {
  func deleteToken() throws
}

// Composición de protocolos
typealias TokenManaging = TokenSaving & TokenReading & TokenDeleting

// ✅ Ejemplo: Protocol extension con default implementation
protocol Identifiable {
  var id: String { get }
}

extension Identifiable {
  var isValid: Bool { !id.isEmpty }
}

// ✅ Ejemplo: Inyección de protocolo para testability
struct LogoutUseCase {
  private let tokenDeleter: TokenDeleting
  
  init(tokenDeleter: TokenDeleting) {
    self.tokenDeleter = tokenDeleter
  }
  
  func execute() throws {
    try tokenDeleter.deleteToken()
  }
}
```

### Value Types (Preferir sobre Reference Types):
✅ **struct por defecto** - class solo cuando necesites identity o herencia
✅ **Inmutabilidad** - let > var siempre que sea posible
✅ **Copy-on-write** - Para structs grandes (Array, Dictionary ya lo hacen)
✅ **Equatable, Hashable** - Implementar para comparación y colecciones
✅ **Codable** - Para serialización JSON/Plist

### Memory Management:
✅ **ARC** - Automatic Reference Counting
✅ **[weak self]** - En closures que pueden outlive self
✅ **[unowned self]** - Solo si self siempre existe mientras closure existe
✅ **Capture lists** - Capturar valores, no referencias
✅ **Evitar retain cycles** - Especialmente en closures, delegates
✅ **Instruments** - Leaks, Zombies, Allocations para profiling
✅ **deinit** - Verificar que se llama cuando debiera

```swift
// ✅ Ejemplo: [weak self] en closure
func loadData() {
  Task { [weak self] in
    guard let self else { return }
    let data = await fetchData()
    await MainActor.run {
      self.updateUI(with: data)
    }
  }
}

// ✅ Ejemplo: Combine con weak self
private var cancellables = Set<AnyCancellable>()

func setupSubscriptions() {
  eventPublisher
    .receive(on: DispatchQueue.main)
    .sink { [weak self] event in
      self?.handle(event: event)
    }
    .store(in: &cancellables)
}

// ✅ Ejemplo: trackForMemoryLeaks en tests
func trackForMemoryLeaks(
  _ instance: AnyObject,
  file: StaticString = #file,
  line: UInt = #line
) {
  addTeardownBlock { [weak instance] in
    XCTAssertNil(instance, "Memory leak detected", file: file, line: line)
  }
}
```

### Optionals (Seguridad de Tipos):
✅ **No force unwrapping (!)** - Casi nunca usar ! (excepción: IBOutlets)
✅ **if let** - Para unwrap opcional usado una vez
✅ **guard let** - Para early return, unwrap queda en scope
✅ **Nil coalescing (??)** - Valores por defecto
✅ **Optional chaining (?.)**  - Cadenas de opcionales
✅ **Implicitly unwrapped (!)**  - Solo para IBOutlets y casos muy específicos

### Clean Architecture en iOS:

```
MyApp/
  Domain/
    Entities/              # Order, User, Store (struct)
    UseCases/              # CreateOrderUseCase
    Repositories/          # OrdersRepositoryProtocol (protocol)
  Application/
    ViewModels/            # OrderViewModel (ObservableObject)
    Coordinators/          # Navigation logic
  Infrastructure/
    Network/
      API/                 # API client (URLSession, Alamofire)
      Repositories/        # OrdersRepository (implementa protocol)
    Persistence/
      CoreData/            # Core Data stack
      UserDefaults/        # Simple key-value
      Keychain/            # Secure storage
  Presentation/
    Views/                 # SwiftUI Views o UIKit ViewControllers
    Components/            # Reusable UI components
```

### Dependency Injection:
✅ **Protocols en domain** - OrdersRepositoryProtocol, NetworkServiceProtocol
✅ **Implementaciones inyectadas** - En initializer, no Singleton
✅ **Factory pattern** - Para crear dependencias complejas
✅ **@Environment en SwiftUI** - Para DI moderna
✅ **No singletons** - Excepto sistema (URLSession.shared está OK)
❌ **Swinject** - Prohibido, DI manual o @Environment

```swift
// ✅ Ejemplo: DI con @Environment en SwiftUI
struct DependencyValues {
  var ordersRepository: any Repository<Order>
  var authService: AuthService
}

extension EnvironmentValues {
  @Entry var dependencies = DependencyValues(
    ordersRepository: OrdersRepositoryImpl(),
    authService: AuthServiceImpl()
  )
}

// Uso en View
struct OrdersView: View {
  @Environment(\.dependencies.ordersRepository) private var repository
  
  var body: some View {
    // ...
  }
}

// ✅ Ejemplo: Factory pattern para dependencias complejas
struct UseCaseFactory {
  private let apiClient: any APIClientProtocol
  private let tokenManager: TokenManaging
  
  init(apiClient: any APIClientProtocol, tokenManager: TokenManaging) {
    self.apiClient = apiClient
    self.tokenManager = tokenManager
  }
  
  func makeLoginUseCase() -> LoginUseCase {
    LoginUseCaseImpl(
      apiClient: apiClient,
      tokenSaver: tokenManager,
      errorMapper: AuthErrorMapperImpl()
    )
  }
}
```

### Networking:
✅ **URLSession con async/await** - Nativo, obligatorio
✅ **Codable** - Decodificación automática de JSON (nunca JSONSerialization)
✅ **Error handling** - Custom NetworkError enum
✅ **Retry logic** - Para requests fallidos
✅ **Request/Response interceptors** - Logging, auth tokens
✅ **SSL pinning** - Para apps con alta seguridad
✅ **Network reachability** - Detectar conectividad
❌ **Alamofire** - Prohibido, usar URLSession nativo
❌ **JSONSerialization** - Prohibido, usar Codable

```swift
// ✅ Ejemplo: APIClient con URLSession y async/await
protocol APIClientProtocol: Sendable {
  func request<T: Decodable>(_ endpoint: APIEndpoint) async -> Result<T, NetworkError>
}

struct APIClient: APIClientProtocol {
  private let session: URLSession
  private let baseURL: String
  private let tokenProvider: TokenReading
  
  func request<T: Decodable>(_ endpoint: APIEndpoint) async -> Result<T, NetworkError> {
    guard let url = URL(string: baseURL + endpoint.path) else {
      return .failure(.invalidURL)
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = endpoint.method.rawValue
    request.httpBody = endpoint.body
    
    if let token = tokenProvider.getToken() {
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    
    do {
      let (data, response) = try await session.data(for: request)
      
      guard let httpResponse = response as? HTTPURLResponse else {
        return .failure(.invalidResponse)
      }
      
      guard (200...299).contains(httpResponse.statusCode) else {
        return .failure(.statusCode(httpResponse.statusCode))
      }
      
      let decoded = try JSONDecoder().decode(T.self, from: data)
      return .success(decoded)
    } catch let error as DecodingError {
      return .failure(.decoding(error))
    } catch {
      return .failure(.network(error))
    }
  }
}

// ✅ Ejemplo: APIEndpoint como struct data-driven (OCP)
struct APIEndpoint: Sendable {
  let path: String
  let method: HTTPMethod
  let body: Data?
  let queryItems: [URLQueryItem]?
  
  // Factories en Domain - extender sin modificar struct base
  static func login(email: String, password: String) -> APIEndpoint {
    let body = try? JSONEncoder().encode(LoginRequest(email: email, password: password))
    return APIEndpoint(path: "/api/v1/auth/login", method: .post, body: body, queryItems: nil)
  }
  
  static func getOrders(page: Int, limit: Int) -> APIEndpoint {
    APIEndpoint(
      path: "/api/v1/orders",
      method: .get,
      body: nil,
      queryItems: [
        URLQueryItem(name: "page", value: String(page)),
        URLQueryItem(name: "limit", value: String(limit))
      ]
    )
  }
}
```

### Persistence:
✅ **UserDefaults** - Settings simples, NO datos sensibles
✅ **KeychainServices nativo** - Passwords, tokens, datos sensibles (NO wrappers de terceros)
✅ **SwiftData (iOS 17+)** - Persistencia moderna preferida
✅ **Core Data** - Solo para proyectos legacy
✅ **FileManager** - Archivos, imágenes, documents
✅ **iCloud** - Sync entre dispositivos (NSUbiquitousKeyValueStore, CloudKit)

### Combine (Reactive):
✅ **Publishers** - AsyncSequence para async, Combine para streams complejos
✅ **@Published** - En ViewModels para binding con Views
✅ **Subscribers** - sink, assign
✅ **Operators** - map, filter, flatMap, combineLatest, merge
✅ **Cancellables** - Almacenar en Set<AnyCancellable>
✅ **Avoid over-use** - async/await más simple para single values

### Concurrencia: async/await OBLIGATORIO

**🚫 PROHIBIDO usar Grand Central Dispatch (GCD)** para operaciones asíncronas en código nuevo.

### NO usar:
- `DispatchQueue.main.async {}`
- `DispatchQueue.global().async {}`
- `DispatchGroup`
- `DispatchSemaphore`
- `OperationQueue` (salvo casos muy específicos de cancelación compleja)
- Callbacks con `@escaping` cuando existe alternativa async

### Usar siempre:
✅ **async/await** - Para operaciones asíncronas
✅ **Task {}** - Para lanzar contextos asíncronos desde código síncrono
✅ **TaskGroup** - Para operaciones paralelas
✅ **AsyncSequence y AsyncStream** - Para flujos de datos
✅ **@MainActor** - Para código que debe ejecutarse en el hilo principal
✅ **actor** - Para estado compartido thread-safe
✅ **Sendable** - Para tipos que cruzan boundaries de concurrencia
✅ **Framework Synchronization con Atomic** - Para operaciones atómicas sin contextos asíncronos

### Ejemplo de migración:
```swift
// ❌ INCORRECTO - GCD legacy
DispatchQueue.global().async {
  let data = fetchData()
  DispatchQueue.main.async {
    self.updateUI(with: data)
  }
}

// ✅ CORRECTO - async/await moderno
Task {
  let data = await fetchData()
  await MainActor.run {
    updateUI(with: data)
  }
}
```

### Testing:
✅ **Swift Testing (iOS 17+)** - Framework de testing moderno preferido
✅ **XCTest** - Solo para proyectos legacy o UI tests
✅ **makeSUT pattern** - Factory para System Under Test
✅ **trackForMemoryLeaks** - Helper para detectar memory leaks en tests
✅ **Spies > Mocks** - Verificar comportamiento real
✅ **Protocols para testability** - Mock con clases que conforman protocol
✅ **#expect y #require** - Assertions de Swift Testing
✅ **Coverage >80%** - Objetivo 95% en lógica crítica
✅ **Fast tests** - <10ms unitarios
❌ **Quick/Nimble** - Prohibido, usar Swift Testing nativo

```swift
// ✅ Ejemplo: Swift Testing con makeSUT pattern
import Testing

@Suite("LoginUseCase Tests")
struct LoginUseCaseTests {
  
  @Test("Given valid credentials, when login, then returns user and saves token")
  func loginSuccess() async throws {
    let (sut, apiClient, tokenSaver) = makeSUT()
    apiClient.stubbedResponse = LoginResponse(user: .testUser, accessToken: "token123")
    
    let user = try await sut.execute(email: "test@example.com", password: "password")
    
    #expect(user.id == User.testUser.id)
    #expect(tokenSaver.savedToken == "token123")
    #expect(apiClient.requestWasCalled)
  }
  
  @Test("Given invalid credentials, when login, then throws unauthorized error")
  func loginUnauthorized() async {
    let (sut, apiClient, _) = makeSUT()
    apiClient.stubbedError = .statusCode(401)
    
    await #expect(throws: AuthError.unauthorized) {
      try await sut.execute(email: "test@example.com", password: "wrong")
    }
  }
  
  private func makeSUT() -> (LoginUseCase, APIClientSpy, TokenSaverSpy) {
    let apiClient = APIClientSpy()
    let tokenSaver = TokenSaverSpy()
    let sut = LoginUseCaseImpl(apiClient: apiClient, tokenSaver: tokenSaver)
    return (sut, apiClient, tokenSaver)
  }
}

// ✅ Ejemplo: Spy para tests
final class APIClientSpy: @unchecked Sendable, APIClientProtocol {
  var stubbedResponse: (any Decodable)?
  var stubbedError: NetworkError?
  var requestWasCalled = false
  var lastEndpoint: APIEndpoint?
  
  func request<T: Decodable>(_ endpoint: APIEndpoint) async -> Result<T, NetworkError> {
    requestWasCalled = true
    lastEndpoint = endpoint
    
    if let error = stubbedError {
      return .failure(error)
    }
    
    guard let response = stubbedResponse as? T else {
      return .failure(.decoding(DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: ""))))
    }
    
    return .success(response)
  }
}
```

### UI Testing:
✅ **XCUITest** - UI testing nativo
✅ **Accessibility identifiers** - Para localizar elementos
✅ **Page Object Pattern** - Encapsular lógica de UI en objetos
✅ **Wait for existence** - XCTWaiter para elementos asíncronos

### Security:
✅ **Keychain** - Passwords, tokens (NO UserDefaults)
✅ **SSL pinning** - Prevenir man-in-the-middle
✅ **Jailbreak detection** - Opcional para apps críticas
✅ **App Transport Security (ATS)** - HTTPS por defecto
✅ **Biometric auth** - Face ID, Touch ID (LocalAuthentication)
✅ **Secure enclave** - Para keys criptográficas
✅ **Obfuscation** - Strings sensibles en código

### Accessibility:
✅ **VoiceOver** - Testear con screen reader
✅ **Dynamic Type** - Font scaling automático
✅ **Accessibility labels** - .accessibilityLabel()
✅ **Traits** - .accessibilityAddTraits(.isButton)
✅ **Reduce motion** - Respetar preferencias del usuario
✅ **Color contrast** - WCAG AA mínimo

### Localization (i18n):
✅ **String Catalogs (.xcstrings)** - Sistema moderno de localización (Xcode 15+)
✅ **String(localized:)** - API moderna para strings traducibles
✅ **Automatic plural handling** - En String Catalogs
✅ **RTL support** - Right-to-left para árabe, hebreo
✅ **NumberFormatter** - Formateo de números, monedas
✅ **DateFormatter** - Fechas localizadas
❌ **Localizable.strings** - Deprecado, usar String Catalogs

### Architecture Patterns:
✅ **MVVM** - Model-View-ViewModel (preferido con SwiftUI)
✅ **MVVM-C** - + Coordinator para navegación
✅ **TCA (The Composable Architecture)** - Para apps grandes, funcional
✅ **VIPER** - Solo si el equipo lo conoce bien (overkill para apps pequeñas)
✅ **MVC (evitar)** - Massive View Controller, no escalable

### SwiftUI Specific:
✅ **@StateObject** - ViewModel ownership
✅ **ObservableObject** - ViewModels con @Published properties
✅ **Equatable Views** - Para optimizar renders
✅ **LazyVStack/LazyHStack** - Para listas grandes
✅ **ScrollViewReader** - Scroll programático
✅ **Preferences** - Comunicación child → parent
✅ **GeometryReader moderación** - Solo cuando sea necesario
✅ **Custom view modifiers** - Reutilizar estilos

### Performance:
✅ **Instruments** - Time Profiler, Allocations, Leaks
✅ **Lazy loading** - LazyVStack, on-demand data
✅ **Image optimization** - Resize, compress, cache
✅ **Background threads** - No bloquear main thread
✅ **Reuse cells** - UITableView/UICollectionView
✅ **Memoization** - Cachear cálculos costosos

### Estructura de Proyecto:
✅ **Un target por plataforma** - Cuando sea necesario
✅ **SPM (Swift Package Manager)** - Para modularización interna
✅ **Feature modules** - Orders, Users, Auth como packages
✅ **Extensions** - Agrupar por funcionalidad, archivos separados
✅ **MARK: -** - Organizar código dentro de archivos
✅ **File naming** - PascalCase para tipos
✅ **Assets en Asset Catalogs** - Con soporte para todos los tamaños
❌ **CocoaPods** - Prohibido
❌ **Carthage** - Prohibido

### Swift Package Manager:
✅ **Dependencies en Package.swift** - Versiones específicas
✅ **Local packages** - Para features grandes
✅ **Testability** - Cada package con sus tests
✅ **Public API** - Solo exponer lo necesario (public, internal, private)

### CI/CD:
✅ **Fastlane** - Automatización de builds, tests, deployments
✅ **xcodebuild** - CLI para builds
✅ **TestFlight** - Beta distribution
✅ **GitHub Actions / Bitrise** - CI/CD pipelines

## Principios de Código Nativo

### Obligatorio:
- **Cero librerías de terceros**: siempre existe solución nativa
- **Codable** para serialización JSON (nunca JSONSerialization)
- **SwiftUI** como framework de UI principal (UIKit solo si estrictamente necesario)
- **SwiftData** para persistencia (CoreData solo en proyectos legacy)
- **Observation** framework (`@Observable`) en vez de `ObservableObject` para iOS 17+
- **Swift Testing** framework para tests (XCTest solo en proyectos legacy)

### APIs Modernas Preferidas:
- `URLSession` con async/await para networking
- `PhotosUI` con `PhotosPicker` para selección de imágenes
- `FileManager` para operaciones de archivos
- `RegexBuilder` para expresiones regulares
- `AttributedString` en vez de NSAttributedString
- `Logger` del framework `os` para logging
- `KeychainServices` nativo para datos sensibles

## Warnings y Errores

- **Cero warnings** en el proyecto: todos deben resolverse
- Activar **Strict Concurrency Checking** en Complete
- Habilitar todas las advertencias del compilador
- Usar `@preconcurrency` solo como medida temporal de migración

### Anti-patterns a EVITAR:
❌ **Massive View Controllers** - ViewControllers >300 líneas
❌ **Force unwrapping (!)** - Salvo IBOutlets y casos justificados
❌ **Singletons** - Dificultan testing
❌ **Storyboards grandes** - Merge conflicts, lentitud
❌ **Magic numbers** - Usar constantes con nombres
❌ **Ignoring warnings** - Warnings = errores futuros
❌ **Retain cycles** - Memory leaks
❌ **Completion handlers** - Usar async/await en código nuevo
❌ **DispatchQueue** - Usar async/await
❌ **Librerías de terceros** - Usar APIs nativas
❌ **any (type erasure)** - Usar generics con protocolos de frontera
❌ **ObservableObject** - Usar @Observable (iOS 17+)
❌ **AnyView** - Afecta performance

### Específicas para RuralGO Mobile:
✅ **Compartir DTOs con backend** - TypeScript → Swift codegen (quicktype, OpenAPI)
✅ **Repository pattern** - OrdersRepositoryProtocol → OrdersRepository
✅ **Use Cases** - CreateOrderUseCase, UpdateOrderStatusUseCase
✅ **ViewModels por pantalla** - OrdersListViewModel, OrderDetailViewModel
✅ **Coordinator para navegación** - No acoplamiento entre Views
✅ **Network layer abstraído** - APIClient protocol en Domain
✅ **APIEndpoint como struct data-driven** - OCP: endpoints en features, no enum central
✅ **Error handling global** - Custom Error enum
✅ **Offline-first (opcional)** - Sync con SwiftData

```swift
// ✅ Ejemplo: Coordinator pattern para navegación
@MainActor
protocol NavigationEventCoordinator: AnyObject {
  func navigate(to route: Route)
  func updateState(to state: AuthenticationState)
  func setError(_ error: Error)
}

@MainActor
final class AppCoordinator: NavigationEventCoordinator {
  private let eventBus: NavigationEventBusProtocol
  private let appState: AppState
  private var cancellables = Set<AnyCancellable>()
  private let eventHandlers: [NavigationEventHandler]
  
  @Published private(set) var currentRoute: Route = .login
  
  init(
    eventBus: NavigationEventBusProtocol,
    appState: AppState,
    eventHandlers: [NavigationEventHandler]
  ) {
    self.eventBus = eventBus
    self.appState = appState
    self.eventHandlers = eventHandlers
    setupEventSubscriptions()
  }
  
  private func setupEventSubscriptions() {
    eventBus.eventPublisher
      .receive(on: DispatchQueue.main)
      .sink { [weak self] event in
        self?.handle(event: event)
      }
      .store(in: &cancellables)
  }
  
  func handle(event: NavigationEvent) {
    guard let handler = eventHandlers.first(where: { $0.canHandle(event) }) else {
      setError(NavigationError.invalidEvent("No handler found"))
      return
    }
    handler.handle(event, coordinator: self)
  }
  
  func navigate(to route: Route) {
    currentRoute = route
  }
  
  func updateState(to state: AuthenticationState) {
    switch state {
    case .unauthenticated:
      appState.setUnauthenticated()
    case .authenticated(let user):
      appState.setAuthenticated(user)
    }
  }
  
  func setError(_ error: Error) {
    appState.setError(error)
  }
}

// ✅ Ejemplo: Event handlers segregados (SRP)
struct LoginSuccessEventHandler: NavigationEventHandler {
  func canHandle(_ event: NavigationEvent) -> Bool {
    if case .loginSuccess = event { return true }
    return false
  }
  
  @MainActor
  func handle(_ event: NavigationEvent, coordinator: NavigationEventCoordinator) {
    guard case .loginSuccess(let user) = event else { return }
    coordinator.updateState(to: .authenticated(user))
    coordinator.navigate(to: .dashboard)
  }
}
```

### Principio fundamental:
✅ **"Measure twice, cut once"** - Planificar arquitectura, dependencias y flujo de datos antes de implementar. Analizar impacto en memoria, performance y UX.
