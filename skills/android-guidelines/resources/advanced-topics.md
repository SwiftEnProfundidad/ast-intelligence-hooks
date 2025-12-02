# Advanced Topics - Android

## Gradle (Build)

✅ **Kotlin DSL** - build.gradle.kts (preferido sobre Groovy)
✅ **Version catalogs** - libs.versions.toml para dependencias
✅ **buildSrc** - Para lógica compartida de build
✅ **Build types** - debug, release, staging
✅ **Product flavors** - Para variantes de app
✅ **Build variants** - Combinación de build type + flavor
✅ **Dependency management** - Versiones consistentes

## Multi-module

✅ **Feature modules** - :feature:orders, :feature:users
✅ **Core modules** - :core:network, :core:database, :core:ui
✅ **App module** - Composición final
✅ **Clear dependencies** - Feature → Core, NO Feature → Feature
✅ **Dynamic features** - Para app bundles grandes (opcional)

## CI/CD

✅ **GitHub Actions / GitLab CI** - Pipelines
✅ **Gradle tasks** - ./gradlew assembleDebug, test
✅ **Lint** - ./gradlew lint (warnings = errores)
✅ **Detekt** - Static analysis para Kotlin
✅ **Firebase App Distribution** - Beta testing
✅ **Play Console** - Production deployment

## Logging

✅ **Timber** - Logging library
✅ **Log levels** - e (error), w (warn), i (info), d (debug)
✅ **NO logs en producción** - if (BuildConfig.DEBUG) Timber.d()
✅ **Crashlytics** - Firebase para crash reporting
✅ **Analytics** - Firebase Analytics o custom

## Configuration

✅ **BuildConfig** - Constantes en tiempo de compilación
✅ **gradle.properties** - Configuración de build
✅ **local.properties** - API keys (NO subir a git)
✅ **secrets-gradle-plugin** - Para API keys seguras
✅ **Environment variables** - Para CI/CD
