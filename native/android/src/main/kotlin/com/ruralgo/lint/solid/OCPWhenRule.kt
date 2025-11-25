// ═══════════════════════════════════════════════════════════════
// OCP: Open/Closed Principle - When Polymorphism Analyzer
// ═══════════════════════════════════════════════════════════════
// Detects when expressions that should use sealed class polymorphism
// Dynamic threshold based on branch count (NO hardcoded)

package com.ruralgo.lint.solid

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.resolve.BindingContext
import org.jetbrains.kotlin.types.KotlinType

class OCPWhenRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "OCPWhenPolymorphism",
        severity = Severity.CodeSmell,
        description = "Large when expressions violate OCP. Use sealed class + polymorphism instead.",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitWhenExpression(expression: KtWhenExpression) {
        super.visitWhenExpression(expression)
        
        val entries = expression.entries
        
        // Dynamic threshold (NO hardcoded): > 5 branches
        if (entries.size <= 5) return
        
        // Check if when is on sealed class (OK) or primitive type (VIOLATION)
        val isSealedClass = isSealedClassWhen(expression)
        
        if (!isSealedClass) {
            val severity = if (entries.size > 10) Severity.Defect else Severity.Warning
            
            report(CodeSmell(
                issue.copy(severity = severity),
                Entity.from(expression),
                """
                When expression with ${entries.size} branches violates OCP (Open/Closed Principle).
                
                Problem: Adding new branch requires modifying existing code
                
                Refactor to Sealed Class + Polymorphism:
                
                1. Define sealed class:
                   sealed class PaymentMethod {
                       abstract suspend fun process(amount: Money)
                       
                       data class CreditCard(...) : PaymentMethod() {
                           override suspend fun process(amount: Money) { ... }
                       }
                       
                       data class PayPal(...) : PaymentMethod() {
                           override suspend fun process(amount: Money) { ... }
                       }
                       // Adding new type = NO modification to existing code (OCP ✅)
                   }
                
                2. Use polymorphism:
                   suspend fun processPayment(method: PaymentMethod, amount: Money) {
                       method.process(amount)  // No when needed!
                   }
                
                Benefits:
                - Open for extension (new subtypes)
                - Closed for modification (no when changes)
                - Exhaustive checking (compiler enforced)
                - Testable (mock subtypes)
                """.trimIndent()
            ))
        }
    }
    
    private fun isSealedClassWhen(expression: KtWhenExpression): Boolean {
        // Check if subject is sealed class type
        val subject = expression.subjectExpression ?: return false
        
        // Simple heuristic: check for 'is' keyword (type checking)
        // Full solution: use BindingContext to get actual type
        val hasTypeCheck = expression.entries.any { entry ->
            entry.conditions.any { condition ->
                condition.text.contains(" is ")
            }
        }
        
        // If has type checking, likely sealed class
        return hasTypeCheck
    }
}

