// ═══════════════════════════════════════════════════════════════
// Feature-First Architecture - Structure Validator
// ═══════════════════════════════════════════════════════════════
// Detects files not organized by feature (anti-pattern: technical grouping)

package com.ruralgo.lint.architecture

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class FeatureDetectorRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "FeatureFirstStructure",
        severity = Severity.CodeSmell,
        description = "Files should be organized by feature, not by technical type",
        debt = Debt.FIVE_MINS
    )
    
    // Technical folders (anti-pattern)
    private val technicalFolders = listOf(
        "viewmodels", "services", "managers", "controllers",
        "helpers", "utils", "utilities"
    )
    
    override fun visitKtFile(file: KtFile) {
        super.visitKtFile(file)
        
        val filePath = file.virtualFile?.path?.lowercase() ?: return
        
        // Check if file is in technical folder
        for (technicalFolder in technicalFolders) {
            if (filePath.contains("/$technicalFolder/")) {
                // Check if NOT in allowed locations
                if (!filePath.contains("/infrastructure/") &&
                    !filePath.contains("/shared/") &&
                    !filePath.contains("/domain/model/") &&  // Domain models OK
                    !filePath.contains("/test/")) {
                    
                    val fileName = file.name
                    
                    report(CodeSmell(
                        issue,
                        Entity.from(file),
                        """
                        Feature-First violation: File in technical folder '/$technicalFolder/'
                        
                        Anti-Pattern: Grouping by technical type
                        ❌ /viewmodels/OrderViewModel.kt
                        ❌ /viewmodels/UserViewModel.kt
                        ❌ /services/OrderService.kt
                        ❌ /services/UserService.kt
                        
                        Problem:
                        - Related code scattered across folders
                        - Hard to find all code for a feature
                        - Violates feature cohesion
                        
                        Feature-First Pattern (CORRECT):
                        ✅ /features/orders/
                            ├── OrdersScreen.kt
                            ├── OrdersViewModel.kt
                            ├── OrdersRepository.kt
                            └── model/Order.kt
                        
                        ✅ /features/users/
                            ├── UsersScreen.kt
                            ├── UsersViewModel.kt
                            └── UsersRepository.kt
                        
                        Benefits:
                        - Feature cohesion (all related code together)
                        - Easy to find code
                        - Easy to delete features
                        - Clear feature boundaries
                        
                        Refactor:
                        Move '$fileName'
                        To: /features/<FeatureName>/
                        
                        Allowed technical folders:
                        - /infrastructure/ (shared infrastructure)
                        - /shared/ (shared utilities)
                        - /domain/model/ (domain models)
                        """.trimIndent()
                    ))
                    
                    break
                }
            }
        }
    }
}

