// ═══════════════════════════════════════════════════════════════
// RequireNotNull Proper Usage
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.nullsafety

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class RequireNotNullUsageRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "RequireNotNullWithMessage",
        severity = Severity.Warning,
        description = "requireNotNull must include descriptive error message",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val calleeText = expression.calleeExpression?.text
        if (calleeText == "requireNotNull" || calleeText == "checkNotNull") {
            val arguments = expression.valueArguments
            val hasLambdaArgument = expression.lambdaArguments.isNotEmpty()
            
            if (arguments.size < 2 && !hasLambdaArgument) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    $calleeText without error message
                    
                    Problem: Unclear what went wrong when exception is thrown
                    
                    ❌ Bad:
                    val user = requireNotNull(maybeUser)
                    
                    ✅ Good:
                    val user = requireNotNull(maybeUser) {
                        "User must not be null at this point"
                    }
                    
                    Benefits:
                    - Clear error messages in production
                    - Easier debugging
                    - Better logs for Crashlytics/Sentry
                    
                    Use cases for requireNotNull:
                    - Preconditions that should never fail
                    - Developer errors (not user errors)
                    - Invariants that must hold
                    """.trimIndent()
                ))
            }
        }
    }
}

