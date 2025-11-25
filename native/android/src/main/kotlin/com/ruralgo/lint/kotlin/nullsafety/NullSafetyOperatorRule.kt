// ═══════════════════════════════════════════════════════════════
// Null Safety Operator Enforcement
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.nullsafety

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class NullSafetyOperatorRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "PreferNullSafetyOperators",
        severity = Severity.Warning,
        description = "Prefer ?., ?:, let over !!",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitBinaryExpression(expression: KtBinaryExpression) {
        super.visitBinaryExpression(expression)
        
        if (expression.operationToken.toString() == "EQEQ") {  // ==
            val right = expression.right
            if (right is KtConstantExpression && right.text == "null") {
                val context = expression.parent
                if (context is KtIfExpression) {
                    report(CodeSmell(
                        issue,
                        Entity.from(expression),
                        """
                        Explicit null check detected
                        
                        Problem: Verbose null handling
                        
                        Consider null-safe alternatives:
                        
                        1. Safe call (?.)
                           // Instead of:
                           if (user != null) user.name else null
                           // Use:
                           user?.name
                        
                        2. Elvis operator (?:)
                           // Instead of:
                           if (user != null) user.name else "Unknown"
                           // Use:
                           user?.name ?: "Unknown"
                        
                        3. let for scoped access:
                           // Instead of:
                           if (user != null) {
                               val name = user.name
                               val age = user.age
                           }
                           // Use:
                           user?.let { safeUser ->
                               val name = safeUser.name
                               val age = safeUser.age
                           }
                        """.trimIndent()
                    ))
                }
            }
        }
    }
}

