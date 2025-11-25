# 🤖 Android AST Intelligence - RuralGO Custom Rules

## ✅ Status: 188/188 Rules Implemented (100%)

Este módulo contiene 188 reglas custom de detekt para análisis de código Android/Kotlin.

---

## 🚀 Quick Start

### Requisitos

```bash
# Instalar Gradle (si no lo tienes)
brew install gradle

# Crear wrapper
cd custom-rules
gradle wrapper --gradle-version 8.5
```

### Build

```bash
./gradlew clean build
# Expected: BUILD SUCCESSFUL ✅
```

### Ejecutar Análisis

```bash
./gradlew detekt
open build/reports/detekt/detekt.html
```

---

## 📊 Reglas Implementadas

- **Kotlin Fundamentals** (25): Null safety, sealed classes, data classes, extensions, scopes
- **Jetpack Compose** (15): State, effects, recomposition
- **Coroutines & Flow** (18): Dispatchers, operators, collectors
- **Hilt DI** (9): Injection, modules, scopes
- **Room** (8): Entities, DAOs, migrations
- **Navigation** (7): NavHost, routes, deep links
- **Security** (7): Keystore, biometric, root detection
- **Performance** (16): Lazy loading, profiling
- **Testing** (12): JUnit5, MockK, Compose tests
- **Accessibility** (6): TalkBack, semantics
- **Localization** (6): i18n, RTL, formatting
- **Gradle** (6): Kotlin DSL, version catalogs
- **Multi-Module** (4): Feature/Core modules
- **Images** (6): Coil, caching

**TOTAL: 188 reglas**

---

## 🔌 Integración

El sistema ya integra automáticamente con `ast-android.js`.

---

## 🐛 Troubleshooting

### Error: "./gradlew: no such file"
```bash
gradle wrapper --gradle-version 8.5
```

### Error: "Unresolved reference"
Agregar import:
```kotlin
import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
```

---

**Sistema multi-plataforma completo: 663 reglas (iOS, Frontend, Backend, Android)**
