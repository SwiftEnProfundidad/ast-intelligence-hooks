// ═══════════════════════════════════════════════════════════════
// Force Unwrap Detection (!!)
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.antipatterns

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class ForceUnwrapRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "NoForceUnwrap",
        severity = Severity.Defect,
        description = "Force unwrap (!!) can crash. Use safe calls (?.), let, or requireNotNull",
        debt = Debt.TEN_MINS
    )
    
    override fun visitPostfixExpression(expression: KtPostfixExpression) {
        super.visitPostfixExpression(expression)
        
        if (expression.operationToken.toString() == "EXCLEXCL") {  // !!
            report(CodeSmell(
                issue,
                Entity.from(expression),
                """
                Force unwrap (!!) detected
                
                Problem: Crashes if value is null
                
                Safe alternatives:
                
                1. Safe call (?.)
                   val name = user?.name
                
                2. Elvis operator (?:)
                   val name = user?.name ?: "Unknown"
                
                3. let for scoped null-check:
                   user?.let { safeUser ->
                       use(safeUser)
                   }
                
                4. requireNotNull (with message):
                   val user = requireNotNull(maybeUser) {
                       "User must not be null"
                   }
                
                Only use !! when:
                - You've checked null explicitly above
                - It's a fatal programmer error (never-null invariant)
                """.trimIndent()
            ))
        }
    }
}

