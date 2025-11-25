package com.ruralgo.lint.security

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class EncryptedPreferencesRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "EncryptedPreferencesRule",
        severity = Severity.Security,
        description = "Sensitive data must use EncryptedSharedPreferences (Security breach)",
        debt = Debt.TWENTY_MINS
    )
    
    private val sensitiveKeywords = listOf(
        "password", "token", "secret", "key", "pin", "credential",
        "auth", "session", "api_key", "access_token", "refresh_token",
        "private", "secure", "sensitive"
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        
        val isGetSharedPreferences = callText.contains("getSharedPreferences") ||
                                     callText.contains("PreferenceManager.getDefaultSharedPreferences")
        
        if (!isGetSharedPreferences) return
        
        val fileName = expression.containingKtFile.name.toLowerCase()
        val fileContent = expression.containingKtFile.text.toLowerCase()
        
        val hasSensitiveData = sensitiveKeywords.any { keyword ->
            fileName.contains(keyword) || fileContent.contains(keyword)
        }
        
        if (hasSensitiveData) {
            val hasEncrypted = callText.contains("EncryptedSharedPreferences") ||
                              fileContent.contains("EncryptedSharedPreferences")
            
            if (!hasEncrypted) {
                report(
                    CodeSmell(
                        issue,
                        Entity.from(expression),
                        """
                        🚨 CRITICAL: Unencrypted Storage for Sensitive Data
                        
                        Detected: SharedPreferences for sensitive data
                        File: ${expression.containingKtFile.name}
                        
                        SECURITY RISK:
                        ❌ Data stored in PLAIN TEXT
                        ❌ Readable with root access
                        ❌ Readable with ADB backup
                        ❌ Accessible to malware
                        ❌ Compliance violation (GDPR, PCI-DSS)
                        ❌ User data breach
                        
                        CURRENT (INSECURE):
                        ```kotlin
                        // ❌ PLAIN TEXT - Anyone can read!
                        val prefs = context.getSharedPreferences("auth", MODE_PRIVATE)
                        prefs.edit()
                            .putString("auth_token", token)  // ❌ Readable
                            .putString("password", password)  // ❌ CRITICAL!
                            .apply()
                        
                        // File location:
                        // /data/data/com.app/shared_prefs/auth.xml
                        // <string name="password">myPassword123</string>
                        ```
                        
                        SOLUTION (ENCRYPTED):
                        ```kotlin
                        import androidx.security.crypto.EncryptedSharedPreferences
                        import androidx.security.crypto.MasterKey
                        
                        // ✅ ENCRYPTED at rest
                        val masterKey = MasterKey.Builder(context)
                            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                            .build()
                        
                        val encryptedPrefs = EncryptedSharedPreferences.create(
                            context,
                            "secure_prefs",
                            masterKey,
                            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                        )
                        
                        encryptedPrefs.edit()
                            .putString("auth_token", token)  // ✅ Encrypted
                            .putString("password", password)  // ✅ Encrypted
                            .apply()
                        
                        // File is encrypted, unreadable without key
                        ```
                        
                        HILT INTEGRATION:
                        ```kotlin
                        @Module
                        @InstallIn(SingletonComponent::class)
                        object SecurityModule {
                            
                            @Provides
                            @Singleton
                            fun provideMasterKey(
                                @ApplicationContext context: Context
                            ): MasterKey {
                                return MasterKey.Builder(context)
                                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                                    .build()
                            }
                            
                            @Provides
                            @Singleton
                            fun provideEncryptedPrefs(
                                @ApplicationContext context: Context,
                                masterKey: MasterKey
                            ): SharedPreferences {
                                return EncryptedSharedPreferences.create(
                                    context,
                                    "secure_prefs",
                                    masterKey,
                                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                                )
                            }
                        }
                        
                        // Usage:
                        @Singleton
                        class AuthRepository @Inject constructor(
                            private val securePrefs: SharedPreferences  // ✅ Encrypted
                        ) {
                            fun saveToken(token: String) {
                                securePrefs.edit()
                                    .putString("auth_token", token)
                                    .apply()
                            }
                        }
                        ```
                        
                        ENCRYPTION DETAILS:
                        - Keys: AES256_SIV (deterministic)
                        - Values: AES256_GCM (authenticated encryption)
                        - Master key: Android Keystore (hardware-backed)
                        - Cannot be extracted even with root
                        
                        WHAT TO ENCRYPT:
                        
                        ✅ MUST encrypt:
                        - Passwords
                        - Auth tokens
                        - API keys
                        - Session IDs
                        - Private keys
                        - Credit card info
                        - Health data
                        - Personal identifiable information (PII)
                        
                        ❌ No need to encrypt:
                        - UI preferences (theme, language)
                        - Public data
                        - Cache keys
                        - Feature flags
                        
                        DEPENDENCIES:
                        ```kotlin
                        // build.gradle.kts
                        dependencies {
                            implementation("androidx.security:security-crypto:1.1.0-alpha06")
                        }
                        ```
                        
                        MIGRATION FROM PLAIN:
                        ```kotlin
                        // Read from old prefs
                        val oldPrefs = context.getSharedPreferences("old", MODE_PRIVATE)
                        val token = oldPrefs.getString("token", null)
                        
                        // Write to encrypted prefs
                        if (token != null) {
                            encryptedPrefs.edit()
                                .putString("token", token)
                                .apply()
                            
                            // Delete from old
                            oldPrefs.edit().remove("token").apply()
                        }
                        ```
                        
                        BACKUP CONSIDERATIONS:
                        ```xml
                        <!-- AndroidManifest.xml -->
                        <application
                            android:allowBackup="false"
                            android:fullBackupContent="@xml/backup_rules">
                        
                        <!-- res/xml/backup_rules.xml -->
                        <full-backup-content>
                            <exclude domain="sharedpref" path="secure_prefs.xml"/>
                        </full-backup-content>
                        ```
                        
                        TESTING:
                        ```kotlin
                        @Test
                        fun testDataIsEncrypted() {
                            val prefs = createEncryptedPrefs()
                            prefs.edit().putString("token", "secret123").commit()
                            
                            // Read raw file
                            val file = File(context.dataDir, "shared_prefs/secure_prefs.xml")
                            val content = file.readText()
                            
                            // Verify NOT readable
                            assertFalse(content.contains("secret123"))
                            assertTrue(content.contains("encrypted"))
                        }
                        ```
                        
                        COMPLIANCE:
                        - GDPR Article 32: Security of processing
                        - PCI-DSS Requirement 3: Protect stored data
                        - HIPAA: Encryption of ePHI
                        - CCPA: Reasonable security
                        
                        ALTERNATIVES:
                        
                        1. Android Keystore (for crypto keys):
                        ```kotlin
                        val keyStore = KeyStore.getInstance("AndroidKeyStore")
                        keyStore.load(null)
                        ```
                        
                        2. SQLCipher (for database):
                        ```kotlin
                        val passphrase = SQLiteDatabase.getBytes("secret".toCharArray())
                        val database = SQLiteDatabase.openOrCreateDatabase(
                            databaseFile,
                            passphrase,
                            null
                        )
                        ```
                        
                        3. Room with encryption:
                        ```kotlin
                        Room.databaseBuilder(context, AppDatabase::class.java, "db")
                            .openHelperFactory(
                                SupportFactory(SQLiteDatabase.getBytes(passphrase.toCharArray()))
                            )
                            .build()
                        ```
                        
                        Android Security Best Practices:
                        "Sensitive data at rest must be encrypted.
                         EncryptedSharedPreferences is the minimum."
                        
                        This is a CRITICAL security vulnerability.
                        Fix IMMEDIATELY before production release.
                        """.trimIndent()
                    )
                )
            }
        }
    }
}

