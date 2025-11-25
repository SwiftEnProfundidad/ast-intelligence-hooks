package com.ruralgo.lint.architecture

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class AndroidDomainPurityRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "AndroidDomainPurityRule",
        severity = Severity.Maintainability,
        description = "Domain layer must not import Android SDK (Clean Architecture)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitImportDirective(importDirective: KtImportDirective) {
        super.visitImportDirective(importDirective)
        
        val filePath = importDirective.containingKtFile.virtualFilePath
        val isDomainLayer = filePath.contains("/domain/") ||
                           filePath.contains("/entities/") ||
                           filePath.contains("/usecases/") ||
                           filePath.contains("/usecase/") ||
                           filePath.contains("/repositories/") && !filePath.contains("Impl")
        
        if (!isDomainLayer) return
        
        val importPath = importDirective.importedFqName?.asString() ?: return
        
        val forbiddenImports = listOf(
            "android." to "Android SDK",
            "androidx." to "AndroidX libraries",
            "com.google.android" to "Google Play Services",
            "kotlinx.android" to "Android Kotlin extensions",
            "io.reactivex" to "RxJava/RxAndroid",
            "com.squareup.retrofit2" to "Retrofit",
            "okhttp3" to "OkHttp",
            "io.ktor" to "Ktor",
            "com.google.firebase" to "Firebase",
            "io.realm" to "Realm"
        )
        
        forbiddenImports.forEach { (prefix, frameworkName) ->
            if (importPath.startsWith(prefix)) {
                report(
                    CodeSmell(
                        issue,
                        Entity.from(importDirective),
                        """
                        🚨 CRITICAL: Domain Layer Violation
                        
                        File: $filePath
                        Import: $importPath
                        Framework: $frameworkName
                        
                        Clean Architecture - Domain Layer:
                        
                        Domain →  NOTHING
                        Data → Domain
                        Presentation → Domain
                        
                        Domain must be:
                        ✅ Pure Kotlin
                        ✅ Platform-agnostic
                        ✅ Framework-independent
                        ✅ Testable without Android
                        
                        Allowed in Domain:
                        ✅ kotlin.*
                        ✅ kotlinx.coroutines.*
                        ✅ java.util.*
                        ✅ Custom domain interfaces
                        
                        Forbidden in Domain:
                        ❌ android.*
                        ❌ androidx.*
                        ❌ Third-party SDKs
                        ❌ UI frameworks
                        ❌ Database libraries
                        
                        REFACTORING:
                        
                        Bad (Coupled):
                        ```kotlin
                        // domain/entities/User.kt
                        import android.graphics.Bitmap  // ❌
                        
                        data class User(
                            val id: String,
                            val name: String,
                            val avatar: Bitmap  // ❌ Android type
                        )
                        ```
                        
                        Good (Decoupled):
                        ```kotlin
                        // domain/entities/User.kt
                        data class User(
                            val id: String,
                            val name: String,
                            val avatarUrl: String  // ✅ Platform-agnostic
                        )
                        
                        // presentation/mappers/UserMapper.kt
                        import android.graphics.Bitmap  // ✅ OK here
                        
                        fun User.toBitmap(): Bitmap {
                            return loadBitmap(avatarUrl)
                        }
                        ```
                        
                        Repository Pattern:
                        ```kotlin
                        // domain/repositories/UserRepository.kt
                        interface UserRepository {
                            suspend fun getUser(id: String): User
                        }
                        
                        // data/repositories/UserRepositoryImpl.kt
                        import com.google.firebase.Firestore  // ✅ OK in Data
                        
                        class UserRepositoryImpl(
                            private val firestore: Firestore
                        ) : UserRepository {
                            override suspend fun getUser(id: String): User {
                                // Firebase implementation
                            }
                        }
                        ```
                        
                        Alternative: $frameworkName → Pure Kotlin types
                        
                        This is CRITICAL for maintainability.
                        """.trimIndent()
                    )
                )
            }
        }
    }
}

