// ═══════════════════════════════════════════════════════════════
// Data Class copy() for Immutability
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.dataclasses

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.containingClassOrObject

class DataClassCopyUsageRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "PreferDataClassCopy",
        severity = Severity.CodeSmell,
        description = "Use copy() for immutable data class updates",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitProperty(property: KtProperty) {
        super.visitProperty(property)
        
        val isMutable = property.isVar
        val containingClass = property.containingClassOrObject as? KtClass
        
        if (isMutable && containingClass?.isData() == true) {
            report(CodeSmell(
                issue,
                Entity.from(property),
                """
                Mutable property (var) in data class
                
                Problem: Breaks immutability, harder to track state changes
                
                ❌ Bad - Mutable data class:
                data class User(
                    var name: String,
                    var email: String
                )
                
                fun updateName(user: User, newName: String) {
                    user.name = newName  // Mutates original!
                }
                
                ✅ Good - Immutable with copy():
                data class User(
                    val name: String,
                    val email: String
                )
                
                fun updateName(user: User, newName: String): User {
                    return user.copy(name = newName)
                }
                
                Benefits of immutability:
                1. Thread-safe - no race conditions
                2. Predictable - no hidden state changes
                3. Testable - pure functions
                4. Compose-friendly - recomposition works correctly
                5. Cacheable - safe to cache references
                
                With Compose State:
                data class UiState(
                    val user: User,
                    val isLoading: Boolean = false
                )
                
                // ViewModel
                fun updateUserName(newName: String) {
                    _state.update { currentState ->
                        currentState.copy(
                            user = currentState.user.copy(name = newName)
                        )
                    }
                }
                
                Multiple property updates:
                val updatedUser = user.copy(
                    name = "New Name",
                    email = "new@email.com"
                )
                
                When var is acceptable:
                - Builder pattern (internal state)
                - Performance-critical code (measure first!)
                - Android framework requirements (rare)
                """.trimIndent()
            ))
        }
    }
}

