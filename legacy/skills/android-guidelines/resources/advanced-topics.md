# Advanced Topics - Android

## Gradle (Build)

✅ **Kotlin DSL** - `build.gradle.kts` (preferred over Groovy)
✅ **Version catalogs** - `libs.versions.toml` for dependencies
✅ **buildSrc** - For shared build logic
✅ **Build types** - debug, release, staging
✅ **Product flavors** - For app variants
✅ **Build variants** - Combination of build type + flavor
✅ **Dependency management** - Consistent versions

## Multi-module

✅ **Feature modules** - :feature:orders, :feature:users
✅ **Core modules** - :core:network, :core:database, :core:ui
✅ **App module** - Final composition
✅ **Clear dependencies** - Feature → Core, NO Feature → Feature
✅ **Dynamic features** - For large app bundles (optional)

## CI/CD

✅ **GitHub Actions / GitLab CI** - Pipelines
✅ **Gradle tasks** - ./gradlew assembleDebug, test
✅ **Lint** - `./gradlew lint` (`warnings = errors`)
✅ **Detekt** - Static analysis for Kotlin
✅ **Firebase App Distribution** - Beta testing
✅ **Play Console** - Production deployment

## Logging

✅ **Timber** - Logging library
✅ **Log levels** - e (error), w (warn), i (info), d (debug)
✅ **No logs in production** - `if (BuildConfig.DEBUG) Timber.d()`
✅ **Crashlytics** - Firebase for crash reporting
✅ **Analytics** - Firebase Analytics o custom

## Configuration

✅ **BuildConfig** - Compile-time constants
✅ **gradle.properties** - Build configuration
✅ **local.properties** - API keys (NO subir a git)
✅ **secrets-gradle-plugin** - For secure API keys
✅ **Environment variables** - For CI/CD
