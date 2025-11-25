# Comparativa Completa: Reglas `.mdc` vs AST Intelligence

**Fecha**: 2025-01-31  
**Estado**: Análisis comparativo exhaustivo por plataforma

---

## 📊 RESUMEN EJECUTIVO

| Plataforma | Reglas en `.mdc` | Reglas Implementadas | Cobertura | Estado |
|------------|------------------|----------------------|-----------|--------|
| **Backend** | ~80 reglas | 21 reglas | 26% | 🚧 En desarrollo |
| **Frontend** | ~60 reglas | 6 reglas | 10% | 🚧 En desarrollo |
| **iOS** | ~70 reglas | 0 reglas | 0% | ⏳ No iniciado |
| **Android** | ~70 reglas | 0 reglas | 0% | ⏳ No iniciado |
| **Comunes** | ~15 reglas | 15 reglas | 100% | ✅ Completo |

**Total**: ~295 reglas definidas, 42 reglas implementadas (**14% de cobertura global**)

---

## 🔵 BACKEND (NestJS/Node.js/TypeScript)

### ✅ REGLAS IMPLEMENTADAS (21 reglas)

#### Fundamentos y Calidad de Código (8 reglas)
- ✅ **types.any** - Detecta uso explícito de `any` (TypeScript strict)
- ✅ **quality.comments** - Detecta comentarios en código de producción (viola "no comentarios")
- ✅ **quality.disabled_lint** - Detecta `eslint-disable` o `ts-ignore`
- ✅ **quality.todo_fixme.uppercase** - Detecta TODO/FIXME en producción (solo mayúsculas)
- ✅ **quality.short_identifier** - Detecta identificadores con longitud <= 2
- ✅ **quality.magic_number** - Detecta números mágicos (excluyendo enum members)
- ✅ **quality.pyramid_of_doom** - Detecta `if/else` profundamente anidados (>3 niveles)
- ✅ **debug.console** - Detecta `console.log|debug|warn` en producción

#### Arquitectura (2 reglas)
- ✅ **architecture.layering** - Detecta violaciones de Clean Architecture (domain→infrastructure, application→infrastructure)
- ✅ **architecture.singleton** - Detecta patrones Singleton (viola DI)

#### Seguridad (4 reglas)
- ✅ **security.secret** - Detecta secretos hardcodeados (API_KEY, SECRET, TOKEN, PASSWORD)
- ✅ **security.sql.raw** - Detecta SQL crudo sin parámetros
- ✅ **security.eval** - Detecta uso de `eval()` o `Function()` constructor
- ✅ **security.exec** - Detecta `child_process.exec|execSync|spawn|spawnSync`

#### Performance (2 reglas)
- ✅ **performance.pagination** - Detecta falta de paginación en queries Supabase
- ✅ **performance.nplus1** - Detecta N+1 queries (queries dentro de loops)

#### Testing (3 reglas)
- ✅ **testing.mocks_in_production** - Detecta mocks/spies en código de producción
- ✅ **testing.aaa_pattern** - Verifica patrón Arrange-Act-Assert en tests
- ✅ **testing.missing_makeSUT** - Verifica uso de `makeSUT` pattern en tests

#### Backend Específico (2 reglas)
- ✅ **backend.di.missing_decorator** - Detecta falta de `@Injectable` en servicios/repositorios/controllers
- ✅ **backend.async.missing_error_handling** - Detecta `await` sin `try-catch`

---

### ⏳ REGLAS FALTANTES CRÍTICAS (59 reglas)

#### SOLID Principles (5 reglas) - **CRÍTICO**
- ⏳ **solid.srp** - Análisis semántico de Single Responsibility (clases con >500 líneas, múltiples responsabilidades)
- ⏳ **solid.ocp** - Análisis de Open/Closed Principle (cambios que requieren modificar código existente)
- ⏳ **solid.lsp** - Análisis de Liskov Substitution Principle (herencia incorrecta, subtipos no sustituibles)
- ⏳ **solid.isp** - Análisis de Interface Segregation (interfaces con demasiados métodos, >10 métodos)
- ⏳ **solid.dip** - Análisis de Dependency Inversion (dependencias concretas en lugar de abstracciones/interfaces)

#### Repository Pattern (3 reglas)
- ⏳ **backend.repository.missing_interface** - Repositorios sin interface en `domain/repositories/`
- ⏳ **backend.repository.business_logic** - Lógica de negocio en repositorios (solo CRUD permitido)
- ⏳ **backend.repository.transaction_missing** - Operaciones multi-tabla sin transacciones

#### Use Cases Pattern (4 reglas)
- ⏳ **backend.usecase.missing_file** - Servicios que deberían ser use cases explícitos
- ⏳ **backend.usecase.missing_preconditions** - Use cases sin validación de precondiciones
- ⏳ **backend.usecase.missing_domain_events** - Use cases sin emisión de eventos de dominio
- ⏳ **backend.usecase.returns_entity** - Use cases que retornan entidades en lugar de DTOs

#### DTOs y Validación (3 reglas)
- ⏳ **backend.dto.missing_validation** - DTOs sin decoradores `class-validator`
- ⏳ **backend.dto.missing_transformer** - DTOs sin `class-transformer` decorators
- ⏳ **backend.dto.nested_missing_validation** - DTOs anidados sin `@ValidateNested()`

#### Database y ORM (4 reglas)
- ⏳ **backend.db.query_not_parameterized** - Queries Supabase sin parámetros (ya parcialmente cubierto con `security.sql.raw`)
- ⏳ **backend.db.missing_indexes** - Queries frecuentes sin índices detectados (requiere análisis de queries)
- ⏳ **backend.db.missing_migrations** - Cambios de schema sin migraciones
- ⏳ **backend.db.connection_pooling** - Configuración de connection pooling

#### Autenticación y Autorización (5 reglas)
- ⏳ **backend.auth.missing_guard** - Rutas protegidas sin `@UseGuards(JwtAuthGuard)`
- ⏳ **backend.auth.missing_roles** - Endpoints que requieren roles sin `@Roles()`
- ⏳ **backend.auth.weak_password_hashing** - Password hashing con bcrypt < 10 salt rounds
- ⏳ **backend.auth.missing_rate_limit** - Endpoints públicos sin `@Throttle()`
- ⏳ **backend.auth.missing_cors** - CORS no configurado o demasiado permisivo

#### Event-Driven Architecture (3 reglas)
- ⏳ **backend.event.missing_handler** - Eventos de dominio sin handlers
- ⏳ **backend.event.blocking_processing** - Event handlers sincrónicos (deberían ser async)
- ⏳ **backend.event.missing_idempotency** - Event handlers no idempotentes

#### Caché (Redis) (3 reglas)
- ⏳ **backend.cache.missing_ttl** - Caché sin TTL configurado
- ⏳ **backend.cache.sensitive_data** - Datos sensibles en caché sin cifrado
- ⏳ **backend.cache.bad_key_naming** - Keys de caché sin convención `module:entity:id`

#### Logging y Observabilidad (4 reglas)
- ⏳ **backend.logging.missing_context** - Logs sin contexto (userId, requestId, traceId)
- ⏳ **backend.logging.sensitive_data** - Logs con datos sensibles (passwords, tokens, PII)
- ⏳ **backend.logging.missing_correlation_id** - Falta de correlation IDs para tracing distribuido
- ⏳ **backend.logging.missing_health_check** - Falta de endpoint `/health` (liveness, readiness)

#### Error Handling (3 reglas)
- ⏳ **backend.error.missing_custom_exceptions** - Uso de excepciones genéricas en lugar de custom exceptions
- ⏳ **backend.error.missing_exception_filter** - Falta de `@Catch()` para manejo global
- ⏳ **backend.error.exposes_stack_trace** - Stack traces expuestos en producción

#### Seguridad Avanzada (4 reglas)
- ⏳ **backend.security.missing_helmet** - Falta de Helmet para security headers
- ⏳ **backend.security.missing_input_validation** - Inputs sin validación con DTOs
- ⏳ **backend.security.missing_xss_prevention** - Falta de sanitización de inputs
- ⏳ **backend.security.missing_audit_logging** - Falta de auditoría de cambios críticos

#### Performance Avanzada (4 reglas)
- ⏳ **backend.performance.missing_eager_loading** - N+1 queries que deberían usar eager loading
- ⏳ **backend.performance.missing_compression** - Responses grandes sin gzip
- ⏳ **backend.performance.missing_query_optimization** - Queries lentas sin `EXPLAIN ANALYZE`
- ⏳ **backend.performance.missing_connection_pooling** - Falta de configuración de connection pooling

#### API Design (4 reglas)
- ⏳ **backend.api.missing_versioning** - APIs sin versionado `/api/v1/`
- ⏳ **backend.api.bad_http_methods** - Uso incorrecto de métodos HTTP (GET para mutaciones, etc.)
- ⏳ **backend.api.missing_swagger** - Endpoints sin documentación Swagger/OpenAPI
- ⏳ **backend.api.missing_idempotency** - PUT/DELETE no idempotentes

#### Configuración (3 reglas)
- ⏳ **backend.config.missing_validation** - Variables de entorno sin validación (Joi o class-validator)
- ⏳ **backend.config.secrets_in_code** - Secrets hardcodeados (ya parcialmente cubierto con `security.secret`)
- ⏳ **backend.config.missing_env_separation** - Falta de separación `.env.development`, `.env.production`

#### Testing Avanzado (2 reglas)
- ⏳ **backend.testing.missing_coverage** - Tests con coverage < 95% en lógica crítica
- ⏳ **backend.testing.slow_tests** - Tests lentos (>100ms integración, >10ms unitarios)

#### Anti-patterns (4 reglas)
- ⏳ **backend.antipattern.god_classes** - Clases con >500 líneas
- ⏳ **backend.antipattern.anemic_domain** - Entidades solo con getters/setters (anemic domain models)
- ⏳ **backend.antipattern.callback_hell** - Uso de callbacks en lugar de `async/await`
- ⏳ **backend.antipattern.logic_in_controllers** - Lógica de negocio en controllers

---

## 🟢 FRONTEND (React/TypeScript/Next.js)

### ✅ REGLAS IMPLEMENTADAS (6 reglas)

#### React Best Practices (3 reglas)
- ✅ **frontend.hooks.conditional** - Detecta hooks llamados condicionalmente
- ✅ **frontend.props.missing_types** - Detecta componentes sin tipos/interfaces para props
- ✅ **frontend.component.too_many_props** - Detecta componentes con >7 props

#### React Anti-patterns (2 reglas)
- ✅ **frontend.dom.direct** - Detecta manipulación directa de DOM (`document.*`, `window.*`, `getElementById`, etc.)
- ✅ **frontend.list.missing_key** - Detecta listas sin `key` prop

#### React Query (1 regla)
- ✅ **frontend.react_query.missing_error** - Detecta React Query hooks sin manejo de errores

---

### ⏳ REGLAS FALTANTES CRÍTICAS (54 reglas)

#### TypeScript Strict (2 reglas)
- ⏳ **frontend.typescript.any_usage** - Ya implementado como `types.any` (común)
- ⏳ **frontend.typescript.missing_generics** - Componentes reutilizables sin generics cuando apropiado

#### React Best Practices (8 reglas)
- ⏳ **frontend.react.class_components** - Detecta class components (solo functional components permitidos)
- ⏳ **frontend.react.missing_memo** - Componentes que deberían usar `React.memo` (muchos re-renders)
- ⏳ **frontend.react.missing_usecallback** - Callbacks sin `useCallback` que causan re-renders
- ⏳ **frontend.react.missing_usememo** - Cálculos costosos sin `useMemo`
- ⏳ **frontend.react.prop_drilling** - Prop drilling excesivo (más de 3 niveles)
- ⏳ **frontend.react.index_as_key** - Uso de índice como `key` cuando el orden puede cambiar
- ⏳ **frontend.react.missing_custom_hooks** - Lógica compleja que debería extraerse a custom hooks
- ⏳ **frontend.react.missing_composition** - Componentes grandes que deberían componerse

#### Next.js 15 Specifics (7 reglas)
- ⏳ **frontend.nextjs.pages_directory** - Uso de `pages/` en lugar de `app/` (legacy)
- ⏳ **frontend.nextjs.missing_server_components** - Componentes que deberían ser Server Components
- ⏳ **frontend.nextjs.unnecessary_client** - `"use client"` innecesario (componentes que podrían ser Server Components)
- ⏳ **frontend.nextjs.missing_dynamic_imports** - Componentes grandes sin `next/dynamic` para code splitting
- ⏳ **frontend.nextjs.missing_next_image** - Imágenes sin `<Image>` de Next.js
- ⏳ **frontend.nextjs.missing_metadata** - Páginas sin `generateMetadata` para SEO
- ⏳ **frontend.nextjs.missing_loading_error** - Rutas sin `loading.tsx` o `error.tsx`

#### Estado y Caché (3 reglas)
- ⏳ **frontend.state.missing_zustand** - Estado global que debería usar Zustand en lugar de prop drilling
- ⏳ **frontend.state.missing_react_query** - Server state sin React Query (caché automático)
- ⏳ **frontend.cache.missing_invalidation** - Mutaciones sin invalidación inteligente de caché

#### Performance (5 reglas)
- ⏳ **frontend.performance.missing_code_splitting** - Componentes grandes sin `React.lazy` o `next/dynamic`
- ⏳ **frontend.performance.missing_virtual_scrolling** - Listas largas sin virtual scrolling (react-window)
- ⏳ **frontend.performance.missing_debounce** - Inputs de búsqueda sin debounce/throttle
- ⏳ **frontend.performance.missing_web_vitals** - Falta de monitoreo de Web Vitals (LCP, FID, CLS)
- ⏳ **frontend.performance.over_memoization** - Uso excesivo de `memo` sin necesidad (premature optimization)

#### Styling (2 reglas)
- ⏳ **frontend.styling.missing_tailwind** - Estilos inline o CSS modules cuando debería usar Tailwind
- ⏳ **frontend.styling.missing_theme_provider** - Falta de `next-themes` para dark/light mode

#### Validación y Forms (2 reglas)
- ⏳ **frontend.forms.missing_react_hook_form** - Forms sin React Hook Form (performance)
- ⏳ **frontend.forms.missing_zod** - Schemas sin Zod para validación type-safe

#### i18n (Internacionalización) (3 reglas)
- ⏳ **frontend.i18n.hardcoded_strings** - Strings hardcodeados sin `useTranslation`
- ⏳ **frontend.i18n.missing_namespaces** - Traducciones sin namespaces por feature/módulo
- ⏳ **frontend.i18n.missing_formatting** - Fechas/números sin formateo localizado (Intl API)

#### Accesibilidad (a11y) (6 reglas)
- ⏳ **frontend.a11y.missing_semantic_html** - Uso de `<div>` en lugar de elementos semánticos (`<button>`, `<nav>`, etc.)
- ⏳ **frontend.a11y.missing_aria_labels** - Elementos interactivos sin `aria-label` o `aria-describedby`
- ⏳ **frontend.a11y.missing_keyboard_navigation** - Elementos no accesibles por teclado
- ⏳ **frontend.a11y.missing_focus_management** - Modales sin focus trap, focus visible faltante
- ⏳ **frontend.a11y.bad_contrast** - Contraste de color < WCAG AA (4.5:1 texto normal, 3:1 texto grande)
- ⏳ **frontend.a11y.missing_screen_reader_testing** - Falta de pruebas con VoiceOver/NVDA

#### Testing Frontend (4 reglas)
- ⏳ **frontend.testing.missing_rtl** - Tests sin React Testing Library (implementation details)
- ⏳ **frontend.testing.bad_queries** - Tests usando `getByTestId` en lugar de `getByRole` > `getByLabelText` > `getByText`
- ⏳ **frontend.testing.missing_userevent** - Tests usando `fireEvent` en lugar de `userEvent`
- ⏳ **frontend.testing.missing_e2e** - Flujos críticos sin tests E2E con Playwright

#### Seguridad Frontend (4 reglas)
- ⏳ **frontend.security.missing_html_sanitization** - HTML de usuario renderizado sin DOMPurify
- ⏳ **frontend.security.missing_csp** - Falta de Content Security Policy en Next.js config
- ⏳ **frontend.security.tokens_in_urls** - Tokens en URLs en lugar de headers
- ⏳ **frontend.security.missing_rate_limiting** - Endpoints públicos sin rate limiting

#### Integración con Backend (3 reglas)
- ⏳ **frontend.api.missing_abstraction** - Llamadas directas a `fetch/axios` sin capa de abstracción
- ⏳ **frontend.api.missing_shared_types** - Tipos no sincronizados con backend (tRPC o Zod)
- ⏳ **frontend.api.missing_global_error_handling** - Falta de interceptors para 401, 500, etc.

#### Clean Architecture Frontend (3 reglas)
- ⏳ **frontend.architecture.missing_layers** - Falta de separación en capas (domain, application, infrastructure, presentation)
- ⏳ **frontend.architecture.missing_repositories** - Falta de repository pattern para abstraer APIs
- ⏳ **frontend.architecture.missing_use_cases** - Lógica de negocio directamente en componentes

---

## 🍎 iOS (Swift/SwiftUI/UIKit)

### ⏳ REGLAS FALTANTES (70 reglas) - **NO INICIADO**

#### Swift Moderno (8 reglas)
- ⏳ **ios.swift.completion_handlers** - Uso de completion handlers en lugar de `async/await`
- ⏳ **ios.swift.missing_structured_concurrency** - Falta de `Task`, `TaskGroup`, `actor` cuando apropiado
- ⏳ **ios.swift.missing_sendable** - Tipos sin `Sendable` conformance para thread-safety
- ⏳ **ios.swift.missing_opaque_types** - Falta de `some View`, `some Publisher` cuando apropiado
- ⏳ **ios.swift.missing_property_wrappers** - Falta de `@State`, `@Binding`, `@Published` cuando apropiado
- ⏳ **ios.swift.missing_generics** - Código reutilizable sin generics type-safe
- ⏳ **ios.swift.swift_version** - Uso de Swift < 5.9

#### SwiftUI (Preferido) (12 reglas)
- ⏳ **ios.swiftui.uikit_unnecessary** - Uso de UIKit cuando SwiftUI sería suficiente
- ⏳ **ios.swiftui.missing_state** - Falta de `@State` para estado local
- ⏳ **ios.swiftui.missing_binding** - Falta de `@Binding` para compartir estado
- ⏳ **ios.swiftui.missing_stateobject** - Falta de `@StateObject` para ObservableObject ownership
- ⏳ **ios.swiftui.missing_observedobject** - Falta de `@ObservedObject` para ObservableObject no-owned
- ⏳ **ios.swiftui.missing_environmentobject** - Falta de `@EnvironmentObject` para DI global
- ⏳ **ios.swiftui.missing_composition** - Views grandes sin composición
- ⏳ **ios.swiftui.missing_viewmodifiers** - Estilos comunes sin ViewModifiers
- ⏳ **ios.swiftui.unnecessary_geometryreader** - `GeometryReader` innecesario
- ⏳ **ios.swiftui.missing_lazy_loading** - Listas largas sin `LazyVStack`/`LazyHStack`
- ⏳ **ios.swiftui.missing_equatable** - Views sin `Equatable` cuando apropiado para optimizar renders
- ⏳ **ios.swiftui.missing_preferences** - Comunicación child → parent sin PreferenceKeys

#### UIKit (Legacy/Necesario) (5 reglas)
- ⏳ **ios.uikit.storyboards** - Uso de Storyboards/XIBs (preferir programmatic UI)
- ⏳ **ios.uikit.missing_autolayout** - Falta de Auto Layout (NSLayoutConstraint o SnapKit)
- ⏳ **ios.uikit.missing_delegation** - Falta de delegation pattern (weak delegates)
- ⏳ **ios.uikit.missing_coordinator** - Navegación compleja sin Coordinator pattern
- ⏳ **ios.uikit.massive_viewcontrollers** - ViewControllers >300 líneas

#### Protocol-Oriented Programming (POP) (3 reglas)
- ⏳ **ios.pop.missing_protocols** - Uso de herencia en lugar de protocols
- ⏳ **ios.pop.missing_protocol_extensions** - Falta de protocol extensions para default implementations
- ⏳ **ios.pop.missing_protocol_composition** - Falta de protocol composition

#### Value Types (5 reglas)
- ⏳ **ios.values.classes_instead_structs** - Uso de `class` cuando `struct` sería suficiente
- ⏳ **ios.values.mutability** - Uso de `var` cuando `let` sería suficiente
- ⏳ **ios.values.missing_equatable** - Tipos sin `Equatable` cuando apropiado
- ⏳ **ios.values.missing_hashable** - Tipos sin `Hashable` cuando apropiado
- ⏳ **ios.values.missing_codable** - Tipos sin `Codable` para serialización JSON/Plist

#### Memory Management (7 reglas)
- ⏳ **ios.memory.missing_weak_self** - Closures sin `[weak self]` cuando pueden outlive self
- ⏳ **ios.memory.unowned_instead_weak** - Uso de `[unowned self]` cuando debería ser `[weak self]`
- ⏳ **ios.memory.retain_cycles** - Retain cycles detectados (especialmente en closures, delegates)
- ⏳ **ios.memory.missing_deinit** - Clases sin `deinit` para verificar cleanup
- ⏳ **ios.memory.force_unwrapping** - Force unwrapping `!` innecesario (solo permitido en IBOutlets)
- ⏳ **ios.memory.missing_capture_lists** - Closures capturando referencias en lugar de valores
- ⏳ **ios.memory.missing_instruments** - Falta de profiling con Instruments (Leaks, Zombies, Allocations)

#### Optionals (Seguridad de Tipos) (3 reglas)
- ⏳ **ios.optionals.force_unwrapping** - Ya parcialmente cubierto con `ios.memory.force_unwrapping`
- ⏳ **ios.optionals.missing_nil_coalescing** - Falta de `??` para valores por defecto
- ⏳ **ios.optionals.missing_optional_chaining** - Falta de `?.` para cadenas de opcionales

#### Clean Architecture iOS (4 reglas)
- ⏳ **ios.architecture.missing_layers** - Falta de separación Domain → Application → Infrastructure → Presentation
- ⏳ **ios.architecture.missing_protocols** - Repositorios sin protocolos en domain
- ⏳ **ios.architecture.missing_use_cases** - Falta de use cases explícitos
- ⏳ **ios.architecture.missing_coordinators** - Navegación sin Coordinator pattern

#### Dependency Injection (4 reglas)
- ⏳ **ios.di.singletons** - Uso de Singletons en lugar de DI (excepto sistema como `URLSession.shared`)
- ⏳ **ios.di.missing_protocols** - Dependencias concretas en lugar de protocols
- ⏳ **ios.di.missing_environment** - Falta de `@EnvironmentObject` para DI en SwiftUI
- ⏳ **ios.di.missing_factory** - Falta de factory pattern para dependencias complejas

#### Networking (6 reglas)
- ⏳ **ios.networking.missing_async_await** - Uso de completion handlers en lugar de `async/await`
- ⏳ **ios.networking.missing_error_handling** - Requests sin manejo de errores (Custom NetworkError enum)
- ⏳ **ios.networking.missing_retry** - Falta de retry logic para requests fallidos
- ⏳ **ios.networking.missing_interceptors** - Falta de interceptors para logging, auth tokens
- ⏳ **ios.networking.missing_ssl_pinning** - Falta de SSL pinning para seguridad alta
- ⏳ **ios.networking.missing_reachability** - Falta de detección de conectividad

#### Persistence (5 reglas)
- ⏳ **ios.persistence.userdefaults_sensitive** - Datos sensibles en UserDefaults (debería usar Keychain)
- ⏳ **ios.persistence.missing_keychain** - Passwords, tokens sin Keychain (Security framework)
- ⏳ **ios.persistence.missing_coredata** - Persistencia compleja sin Core Data o SwiftData
- ⏳ **ios.persistence.missing_icloud** - Falta de sync con iCloud cuando apropiado
- ⏳ **ios.persistence.missing_filemanager** - Archivos sin FileManager apropiado

#### Testing (6 reglas)
- ⏳ **ios.testing.missing_xctest** - Tests sin XCTest framework
- ⏳ **ios.testing.missing_makesut** - Tests sin makeSUT pattern
- ⏳ **ios.testing.missing_memory_leaks** - Falta de `trackForMemoryLeaks` helper
- ⏳ **ios.testing.mocks_instead_spies** - Uso de mocks en lugar de spies
- ⏳ **ios.testing.missing_coverage** - Tests con coverage < 80% (objetivo 95% en lógica crítica)
- ⏳ **ios.testing.slow_tests** - Tests lentos (>10ms unitarios)

#### UI Testing (2 reglas)
- ⏳ **ios.uitesting.missing_xcuitest** - Falta de UI tests con XCUITest
- ⏳ **ios.uitesting.missing_accessibility** - Falta de accessibility identifiers para localizar elementos

#### Security (6 reglas)
- ⏳ **ios.security.missing_keychain** - Passwords, tokens en UserDefaults (debería usar Keychain)
- ⏳ **ios.security.missing_ssl_pinning** - Falta de SSL pinning
- ⏳ **ios.security.missing_jailbreak_detection** - Falta de detección de jailbreak (opcional para apps críticas)
- ⏳ **ios.security.missing_ats** - Falta de App Transport Security (ATS) - HTTPS por defecto
- ⏳ **ios.security.missing_biometric** - Falta de autenticación biométrica (Face ID, Touch ID)
- ⏳ **ios.security.missing_secure_enclave** - Falta de Secure Enclave para keys criptográficas

#### Accessibility (5 reglas)
- ⏳ **ios.accessibility.missing_voiceover** - Falta de pruebas con VoiceOver (screen reader)
- ⏳ **ios.accessibility.missing_dynamic_type** - Falta de soporte para Dynamic Type (font scaling)
- ⏳ **ios.accessibility.missing_labels** - Elementos sin `.accessibilityLabel()`
- ⏳ **ios.accessibility.missing_traits** - Falta de `.accessibilityAddTraits(.isButton)`
- ⏳ **ios.accessibility.missing_reduce_motion** - Falta de respeto a preferencias de reduce motion

#### Localization (i18n) (5 reglas)
- ⏳ **ios.i18n.hardcoded_strings** - Strings hardcodeados sin `NSLocalizedString`
- ⏳ **ios.i18n.missing_stringsdict** - Falta de Stringsdict para plurales
- ⏳ **ios.i18n.missing_rtl** - Falta de soporte Right-to-left (árabe, hebreo)
- ⏳ **ios.i18n.missing_number_formatter** - Falta de NumberFormatter para números, monedas
- ⏳ **ios.i18n.missing_date_formatter** - Falta de DateFormatter para fechas localizadas

#### Performance (4 reglas)
- ⏳ **ios.performance.missing_lazy_loading** - Falta de lazy loading (LazyVStack, on-demand data)
- ⏳ **ios.performance.missing_image_optimization** - Imágenes sin resize, compress, cache
- ⏳ **ios.performance.blocking_main_thread** - Código bloqueando main thread
- ⏳ **ios.performance.missing_memoization** - Cálculos costosos sin memoization

#### Code Organization (3 reglas)
- ⏳ **ios.organization.missing_spm** - Falta de Swift Package Manager para modularización
- ⏳ **ios.organization.missing_feature_modules** - Features sin módulos separados
- ⏳ **ios.organization.missing_mark** - Falta de `MARK: -` para organizar código dentro de archivos

---

## 🤖 ANDROID (Kotlin/Jetpack Compose)

### ⏳ REGLAS FALTANTES (70 reglas) - **NO INICIADO**

#### Kotlin 100% (9 reglas)
- ⏳ **android.kotlin.java_code** - Código Java en lugar de Kotlin
- ⏳ **android.kotlin.kotlin_version** - Uso de Kotlin < 1.9
- ⏳ **android.kotlin.callbacks** - Uso de callbacks en lugar de Coroutines `async/await`
- ⏳ **android.kotlin.missing_flow** - Falta de Flow para streams de datos reactivos
- ⏳ **android.kotlin.missing_sealed_classes** - Falta de sealed classes para estados (Success, Error, Loading)
- ⏳ **android.kotlin.missing_data_classes** - DTOs sin data classes
- ⏳ **android.kotlin.missing_extension_functions** - Falta de extension functions
- ⏳ **android.kotlin.missing_scope_functions** - Falta de scope functions (let, run, apply, also, with)
- ⏳ **android.kotlin.force_unwrapping** - Force unwrapping `!!` innecesario (usar `?`, `?:`, `let`, `requireNotNull`)

#### Jetpack Compose (UI Declarativo) (12 reglas)
- ⏳ **android.compose.xml_layouts** - Uso de XML layouts en lugar de Compose
- ⏳ **android.compose.missing_state_hoisting** - Falta de state hoisting al nivel apropiado
- ⏳ **android.compose.missing_remember** - Falta de `remember` para mantener estado entre recomposiciones
- ⏳ **android.compose.missing_remember_saveable** - Falta de `rememberSaveable` para sobrevivir process death
- ⏳ **android.compose.missing_derived_state** - Falta de `derivedStateOf` para cálculos derivados de state
- ⏳ **android.compose.missing_launched_effect** - Falta de `LaunchedEffect` para side effects con lifecycle
- ⏳ **android.compose.missing_disposable_effect** - Falta de `DisposableEffect` para cleanup
- ⏳ **android.compose.non_idempotent** - Composables no idempotentes (violan recomposition)
- ⏳ **android.compose.modifier_order** - Orden incorrecto de Modifiers (padding antes que background)
- ⏳ **android.compose.missing_preview** - Falta de `@Preview` para ver UI sin correr app
- ⏳ **android.compose.missing_lazy_column** - Listas sin `LazyColumn`/`LazyRow` (virtualización)
- ⏳ **android.compose.missing_recomposition_optimization** - Parámetros mutables o inestables causando re-renders

#### Material Design 3 (4 reglas)
- ⏳ **android.material.missing_material3** - Falta de Material 3 components
- ⏳ **android.material.missing_theme** - Falta de Theme (Color scheme, typography, shapes)
- ⏳ **android.material.missing_dark_theme** - Falta de soporte dark theme (`isSystemInDarkTheme()`)
- ⏳ **android.material.missing_adaptive_layouts** - Falta de responsive design (WindowSizeClass)

#### Architecture (MVVM + Clean) (7 reglas)
- ⏳ **android.architecture.missing_mvvm** - Falta de MVVM (Model-View-ViewModel)
- ⏳ **android.architecture.multiple_activities** - Múltiples Activities en lugar de Single Activity + Composables
- ⏳ **android.architecture.missing_viewmodel** - Falta de `androidx.lifecycle.ViewModel`
- ⏳ **android.architecture.missing_stateflow** - Falta de `StateFlow`/`SharedFlow` para exponer estado
- ⏳ **android.architecture.missing_repository** - Falta de repository pattern para abstraer acceso a datos
- ⏳ **android.architecture.missing_use_cases** - Falta de use cases para lógica de negocio encapsulada
- ⏳ **android.architecture.missing_clean_layers** - Falta de separación Domain → Data → Presentation

#### Dependency Injection (Hilt) (6 reglas)
- ⏳ **android.di.missing_hilt** - Falta de Hilt DI framework (uso de manual factories)
- ⏳ **android.di.missing_hilt_app** - Falta de `@HiltAndroidApp` en Application class
- ⏳ **android.di.missing_entry_point** - Falta de `@AndroidEntryPoint` en Activity, Fragment, ViewModel
- ⏳ **android.di.missing_inject** - Falta de `@Inject constructor` para constructor injection
- ⏳ **android.di.missing_modules** - Falta de `@Module + @InstallIn` para provide dependencies
- ⏳ **android.di.singletons_everywhere** - Uso de Singletons en lugar de Hilt DI

#### Coroutines (Async) (5 reglas)
- ⏳ **android.coroutines.missing_suspend** - Falta de `suspend functions` para operaciones async
- ⏳ **android.coroutines.missing_viewmodel_scope** - Falta de `viewModelScope` para cancelación automática
- ⏳ **android.coroutines.missing_dispatchers** - Falta de `Dispatchers` apropiados (Main, IO, Default)
- ⏳ **android.coroutines.missing_supervisor** - Falta de `supervisorScope` cuando errores no deberían cancelar otros jobs
- ⏳ **android.coroutines.missing_error_handling** - Falta de `try-catch` en coroutines

#### Flow (Reactive Streams) (4 reglas)
- ⏳ **android.flow.missing_stateflow** - Falta de `StateFlow` para estado (hot stream, siempre tiene valor)
- ⏳ **android.flow.missing_sharedflow** - Falta de `SharedFlow` para eventos (hot stream, puede no tener valor)
- ⏳ **android.flow.missing_operators** - Falta de operators (map, filter, combine, flatMapLatest, catch)
- ⏳ **android.flow.missing_collect_as_state** - Falta de `collectAsState` en Compose para observar Flow

#### Networking (Retrofit) (5 reglas)
- ⏳ **android.networking.missing_retrofit** - Falta de Retrofit para REST client
- ⏳ **android.networking.missing_okhttp** - Falta de OkHttp con interceptors
- ⏳ **android.networking.missing_suspend** - API service sin `suspend functions`
- ⏳ **android.networking.missing_error_handling** - Falta de error handling (Custom sealed class Result<T>)
- ⏳ **android.networking.missing_retry** - Falta de retry logic (exponential backoff)

#### Persistence (Room) (6 reglas)
- ⏳ **android.persistence.missing_room** - Falta de Room para SQLite wrapper type-safe
- ⏳ **android.persistence.missing_entity** - Falta de `@Entity` para tablas
- ⏳ **android.persistence.missing_dao** - Falta de `@Dao` con `suspend functions`
- ⏳ **android.persistence.missing_flow_queries** - Queries sin `Flow<T>` para observables
- ⏳ **android.persistence.missing_migrations** - Falta de migrations para versionado de schema
- ⏳ **android.persistence.missing_transactions** - Operaciones multi-query sin `@Transaction`

#### State Management (4 reglas)
- ⏳ **android.state.missing_viewmodel** - Falta de ViewModel (sobrevive configuration changes)
- ⏳ **android.state.missing_stateflow** - Falta de `StateFlow` para estado mutable observable
- ⏳ **android.state.missing_ui_state** - Falta de `UiState sealed class` (Loading, Success, Error states)
- ⏳ **android.state.mutable_state** - Estado mutable en lugar de inmutable (data class + copy())

#### Navigation (4 reglas)
- ⏳ **android.navigation.missing_navigation_compose** - Falta de Navigation Compose
- ⏳ **android.navigation.missing_navhost** - Falta de `NavHost` container
- ⏳ **android.navigation.missing_navcontroller** - Falta de `NavController` para controlar navegación
- ⏳ **android.navigation.missing_deep_links** - Falta de soporte para deep links

#### Testing (7 reglas)
- ⏳ **android.testing.missing_junit5** - Falta de JUnit5 (preferido sobre JUnit4)
- ⏳ **android.testing.missing_mockk** - Falta de MockK para mocking library Kotlin
- ⏳ **android.testing.missing_turbine** - Falta de Turbine para testing de Flows
- ⏳ **android.testing.missing_compose_ui_test** - Falta de Compose UI Test
- ⏳ **android.testing.missing_truth** - Falta de Truth para assertions más legibles
- ⏳ **android.testing.missing_coverage** - Tests con coverage < 80% (objetivo 95% en lógica crítica)
- ⏳ **android.testing.missing_aaa_pattern** - Tests sin AAA pattern (Arrange, Act, Assert)

#### Security (6 reglas)
- ⏳ **android.security.userdefaults_sensitive** - Datos sensibles en SharedPreferences (debería usar EncryptedSharedPreferences)
- ⏳ **android.security.missing_keystore** - Falta de Keystore para claves criptográficas
- ⏳ **android.security.missing_network_security** - Falta de Network Security Config (certificate pinning)
- ⏳ **android.security.missing_proguard** - Falta de ProGuard/R8 para ofuscación en release
- ⏳ **android.security.missing_biometric** - Falta de autenticación biométrica (BiometricPrompt API)
- ⏳ **android.security.missing_root_detection** - Falta de detección de root (dispositivos rooted)

#### Performance (6 reglas)
- ⏳ **android.performance.missing_paging** - Falta de Paging 3 para paginación de datos grandes
- ⏳ **android.performance.missing_workmanager** - Falta de WorkManager para background tasks
- ⏳ **android.performance.missing_baseline_profiles** - Falta de Baseline Profiles para optimización de startup
- ⏳ **android.performance.missing_leakcanary** - Falta de LeakCanary para detección de memory leaks
- ⏳ **android.performance.missing_profiler** - Falta de Android Profiler (CPU, Memory, Network profiling)
- ⏳ **android.performance.missing_recomposition_optimization** - Falta de optimización de recomposition (stability, remember, derivedStateOf)

#### Accessibility (4 reglas)
- ⏳ **android.accessibility.missing_talkback** - Falta de pruebas con TalkBack (screen reader)
- ⏳ **android.accessibility.missing_content_description** - Imágenes y botones sin `contentDescription`
- ⏳ **android.accessibility.missing_semantics** - Falta de `semantics` en Compose para accesibilidad
- ⏳ **android.accessibility.bad_contrast** - Contraste < WCAG AA mínimo

#### Localization (i18n) (5 reglas)
- ⏳ **android.i18n.hardcoded_strings** - Strings hardcodeados sin `strings.xml`
- ⏳ **android.i18n.missing_plurals** - Falta de `values/plurals.xml` para plurales
- ⏳ **android.i18n.missing_rtl** - Falta de soporte RTL (start/end en lugar de left/right)
- ⏳ **android.i18n.missing_date_format** - Falta de DateFormat para fechas localizadas
- ⏳ **android.i18n.missing_number_format** - Falta de NumberFormat para números, monedas localizados

#### Gradle (Build) (4 reglas)
- ⏳ **android.gradle.missing_kotlin_dsl** - Falta de Kotlin DSL (`build.gradle.kts` en lugar de Groovy)
- ⏳ **android.gradle.missing_version_catalogs** - Falta de version catalogs (`libs.versions.toml`)
- ⏳ **android.gradle.missing_build_types** - Falta de build types (debug, release, staging)
- ⏳ **android.gradle.missing_product_flavors** - Falta de product flavors para variantes de app

#### Multi-module (3 reglas)
- ⏳ **android.modules.missing_feature_modules** - Falta de feature modules (`:feature:orders`, `:feature:users`)
- ⏳ **android.modules.missing_core_modules** - Falta de core modules (`:core:network`, `:core:database`, `:core:ui`)
- ⏳ **android.modules.bad_dependencies** - Dependencias incorrectas (Feature → Feature en lugar de Feature → Core)

#### Logging (3 reglas)
- ⏳ **android.logging.missing_timber** - Falta de Timber para logging library
- ⏳ **android.logging.logs_in_production** - Logs en producción (debería usar `if (BuildConfig.DEBUG) Timber.d()`)
- ⏳ **android.logging.missing_crashlytics** - Falta de Crashlytics para crash reporting

---

## 🎯 REGLAS COMUNES (Cross-Platform)

### ✅ REGLAS IMPLEMENTADAS (15 reglas)

- ✅ **types.any** - Detecta uso explícito de `any` (TypeScript)
- ✅ **quality.comments** - Detecta comentarios en código de producción
- ✅ **quality.disabled_lint** - Detecta `eslint-disable` o `ts-ignore`
- ✅ **quality.todo_fixme.uppercase** - Detecta TODO/FIXME en producción
- ✅ **quality.short_identifier** - Detecta identificadores con longitud <= 2
- ✅ **quality.magic_number** - Detecta números mágicos
- ✅ **quality.pyramid_of_doom** - Detecta `if/else` profundamente anidados
- ✅ **debug.console** - Detecta `console.log|debug|warn`
- ✅ **security.secret** - Detecta secretos hardcodeados
- ✅ **security.sql.raw** - Detecta SQL crudo
- ✅ **security.eval** - Detecta `eval()` peligroso
- ✅ **security.exec** - Detecta `child_process.exec|spawn`
- ✅ **architecture.singleton** - Detecta patrones Singleton
- ✅ **testing.mocks_in_production** - Detecta mocks/spies en producción
- ✅ **testing.aaa_pattern** - Verifica patrón AAA en tests
- ✅ **testing.missing_makeSUT** - Verifica uso de `makeSUT` pattern

---

## 📈 MÉTRICAS DE IMPLEMENTACIÓN

### Por Plataforma:

| Plataforma | Implementadas | Faltantes | Cobertura |
|------------|---------------|-----------|-----------|
| Backend | 21 | 59 | 26% |
| Frontend | 6 | 54 | 10% |
| iOS | 0 | 70 | 0% |
| Android | 0 | 70 | 0% |
| Comunes | 15 | 0 | 100% |

### Por Categoría:

| Categoría | Implementadas | Faltantes | Prioridad |
|-----------|---------------|-----------|-----------|
| **SOLID Principles** | 0 | 5 | 🔴 CRÍTICA |
| **Security** | 4 | 14 | 🔴 CRÍTICA |
| **Architecture** | 2 | 15 | 🟠 ALTA |
| **Testing** | 3 | 17 | 🟠 ALTA |
| **Performance** | 2 | 15 | 🟠 ALTA |
| **Code Quality** | 8 | 25 | 🟡 MEDIA |
| **Platform-Specific** | 6 | 124 | 🟡 MEDIA |
| **Comunes** | 15 | 0 | ✅ COMPLETA |

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### 🔴 CRÍTICO (Implementar primero)

1. **SOLID Principles** (5 reglas) - Análisis semántico avanzado
   - `solid.srp` - Single Responsibility Principle
   - `solid.ocp` - Open/Closed Principle
   - `solid.lsp` - Liskov Substitution Principle
   - `solid.isp` - Interface Segregation Principle
   - `solid.dip` - Dependency Inversion Principle

2. **Security Backend** (9 reglas adicionales)
   - `backend.auth.missing_guard` - Rutas protegidas sin guards
   - `backend.security.missing_helmet` - Falta de Helmet
   - `backend.security.missing_input_validation` - Inputs sin validación
   - `backend.security.missing_xss_prevention` - Falta de sanitización
   - `backend.security.missing_audit_logging` - Falta de auditoría
   - `backend.auth.weak_password_hashing` - Password hashing débil
   - `backend.auth.missing_rate_limit` - Falta de rate limiting
   - `backend.auth.missing_cors` - CORS mal configurado
   - `backend.config.secrets_in_code` - Secrets hardcodeados (ya parcialmente implementado)

3. **Security Frontend** (4 reglas)
   - `frontend.security.missing_html_sanitization` - HTML sin sanitizar
   - `frontend.security.missing_csp` - Falta de CSP
   - `frontend.security.tokens_in_urls` - Tokens en URLs
   - `frontend.security.missing_rate_limiting` - Falta de rate limiting

### 🟠 ALTA PRIORIDAD (Siguiente fase)

4. **Architecture Backend** (15 reglas)
   - `backend.repository.missing_interface` - Repositorios sin interfaces
   - `backend.usecase.missing_file` - Servicios que deberían ser use cases
   - `backend.usecase.missing_preconditions` - Use cases sin validación
   - `backend.dto.missing_validation` - DTOs sin validación
   - `backend.event.missing_handler` - Eventos sin handlers

5. **Testing** (17 reglas adicionales)
   - `backend.testing.missing_coverage` - Coverage < 95%
   - `frontend.testing.missing_rtl` - Falta de React Testing Library
   - `frontend.testing.missing_e2e` - Falta de E2E con Playwright

6. **Performance** (15 reglas adicionales)
   - `backend.performance.missing_eager_loading` - N+1 queries
   - `frontend.performance.missing_code_splitting` - Falta de code splitting
   - `frontend.performance.missing_virtual_scrolling` - Listas largas sin virtual scrolling

### 🟡 MEDIA PRIORIDAD (Futuro)

7. **Platform-Specific Rules** (124 reglas)
   - Reglas específicas de iOS cuando exista código iOS
   - Reglas específicas de Android cuando exista código Android
   - Reglas específicas de Next.js avanzadas
   - Reglas específicas de NestJS avanzadas

---

## 📝 NOTAS FINALES

1. **Cobertura Actual**: 14% de las reglas definidas están implementadas (42/295)
2. **Prioridad**: Implementar primero SOLID y Security, luego Architecture y Testing
3. **iOS/Android**: Las reglas están definidas pero no implementadas porque no existe código iOS/Android en el repositorio actual
4. **Reglas Comunes**: 100% implementadas (15/15)
5. **Complejidad**: Las reglas SOLID requieren análisis semántico avanzado, no solo pattern matching

---

**Última actualización**: 2025-01-31  
**Próxima revisión**: Después de implementar SOLID y Security críticas

