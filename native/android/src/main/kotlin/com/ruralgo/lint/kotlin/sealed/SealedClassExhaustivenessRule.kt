// ═══════════════════════════════════════════════════════════════
// Exhaustive When with Sealed Classes
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.sealed

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class SealedClassExhaustivenessRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "SealedClassExhaustiveWhen",
        severity = Severity.Warning,
        description = "When expressions with sealed classes should be exhaustive",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitWhenExpression(expression: KtWhenExpression) {
        super.visitWhenExpression(expression)
        
        val subjectExpression = expression.subjectExpression ?: return
        val elseEntry = expression.elseExpression
        
        val hasElse = elseEntry != null
        
        if (hasElse) {
            val mightBeSealed = subjectExpression.text.let { subject ->
                subject.contains("State") || 
                subject.contains("Result") || 
                subject.contains("Event")
            }
            
            if (mightBeSealed) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    When expression with else on potential sealed class
                    
                    Problem: Compiler can't enforce exhaustiveness
                    
                    ❌ Bad - Loses exhaustiveness checking:
                    when (state) {
                        is OrderState.Loading -> showLoading()
                        is OrderState.Success -> showOrder(state.order)
                        else -> showError()  // Hides missing cases!
                    }
                    
                    ✅ Good - Compiler enforces all cases:
                    when (state) {
                        is OrderState.Loading -> showLoading()
                        is OrderState.Success -> showOrder(state.order)
                        is OrderState.Error -> showError(state.message)
                        // Compiler error if new state added!
                    }
                    
                    Benefits:
                    - Compiler catches missing cases
                    - Refactoring is safer
                    - IDE provides exhaustiveness checking
                    - No hidden bugs when adding new states
                    
                    When to use else:
                    - Only with enums or non-sealed classes
                    - When you truly want default behavior
                    
                    For exhaustive when as expression:
                    val message = when (state) {
                        is OrderState.Loading -> "Loading..."
                        is OrderState.Success -> "Success!"
                        is OrderState.Error -> "Error: ${'$'}{state.message}"
                    }
                    
                    Kotlin compiler enforces exhaustiveness automatically
                    when when is used as an expression!
                    """.trimIndent()
                ))
            }
        }
    }
}

