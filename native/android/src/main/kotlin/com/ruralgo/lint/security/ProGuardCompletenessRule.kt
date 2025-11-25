package com.ruralgo.lint.security

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import java.io.File

class ProGuardCompletenessRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "ProGuardCompletenessRule",
        severity = Severity.Security,
        description = "ProGuard/R8 rules must be complete for release builds (Code protection)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitKtFile(file: KtFile) {
        super.visitKtFile(file)
        
        val filePath = file.virtualFilePath
        val projectRoot = File(filePath).parentFile?.parentFile?.parentFile ?: return
        
        val proguardFile = File(projectRoot, "proguard-rules.pro")
        
        if (!proguardFile.exists()) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(file),
                    """
                    🚨 CRITICAL: Missing ProGuard Rules
                    
                    File: proguard-rules.pro not found
                    
                    SECURITY RISK:
                    ❌ Code not obfuscated → reverse engineering easy
                    ❌ API keys discoverable
                    ❌ Business logic exposed
                    ❌ Intellectual property theft
                    
                    CREATE: proguard-rules.pro
                    
                    ```proguard
                    # Keep domain models
                    -keep class com.yourapp.domain.** { *; }
                    
                    # Keep API DTOs (Retrofit/Moshi)
                    -keep class com.yourapp.data.remote.dto.** { *; }
                    -keepclassmembers class * {
                        @com.squareup.moshi.* <methods>;
                    }
                    
                    # Keep Room entities
                    -keep class * extends androidx.room.RoomDatabase
                    -keep @androidx.room.Entity class *
                    
                    # Keep Hilt
                    -keep class dagger.hilt.** { *; }
                    -keep class javax.inject.** { *; }
                    -keep class * extends dagger.hilt.android.internal.managers.** { *; }
                    
                    # Keep enums
                    -keepclassmembers enum * {
                        public static **[] values();
                        public static ** valueOf(java.lang.String);
                    }
                    
                    # Remove logging
                    -assumenosideeffects class android.util.Log {
                        public static *** d(...);
                        public static *** v(...);
                        public static *** i(...);
                    }
                    ```
                    
                    Enable in build.gradle.kts:
                    ```kotlin
                    android {
                        buildTypes {
                            release {
                                isMinifyEnabled = true
                                proguardFiles(
                                    getDefaultProguardFile("proguard-android-optimize.txt"),
                                    "proguard-rules.pro"
                                )
                            }
                        }
                    }
                    ```
                    
                    Test obfuscation:
                    ```bash
                    ./gradlew assembleRelease
                    unzip -l app/build/outputs/apk/release/app-release.apk
                    # Class names should be obfuscated: a.b.c instead of com.app.MyClass
                    ```
                    """.trimIndent()
                )
            )
        }
    }
}

