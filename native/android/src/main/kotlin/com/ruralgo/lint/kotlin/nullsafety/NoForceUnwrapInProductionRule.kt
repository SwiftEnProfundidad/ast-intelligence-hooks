// ═══════════════════════════════════════════════════════════════
// No Force Unwrap in Production Code
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.nullsafety

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class NoForceUnwrapInProductionRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "NoForceUnwrapProduction",
        severity = Severity.Defect,
        description = "Force unwrap (!!) forbidden in production code",
        debt = Debt.TEN_MINS
    )
    
    override fun visitPostfixExpression(expression: KtPostfixExpression) {
        super.visitPostfixExpression(expression)
        
        if (expression.operationToken.toString() == "EXCLEXCL") {  // !!
            val file = expression.containingKtFile
            val isTestFile = file.name.contains("Test") || 
                           file.packageFqName.asString().contains("test")
            
            if (!isTestFile) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    Force unwrap (!!) in production code
                    
                    Problem: CRASHES the app if value is null
                    
                    ❌ NEVER in production:
                    val name = user!!.name  // CRASH if user is null
                    
                    ✅ Safe alternatives:
                    
                    1. Safe call with Elvis:
                    val name = user?.name ?: "Unknown"
                    
                    2. Early return:
                    val user = repository.getUser() ?: return
                    val name = user.name
                    
                    3. let for scoped access:
                    user?.let { safeUser ->
                        val name = safeUser.name
                    }
                    
                    4. requireNotNull with message (for invariants):
                    val user = requireNotNull(maybeUser) {
                        "User must be initialized before accessing"
                    }
                    
                    When !! is acceptable:
                    - Test files (mocked data is never null)
                    - After explicit null check immediately above
                    - Checked exceptions that truly never happen
                    
                    Remember:
                    - Every !! is a potential crash
                    - Null pointer crashes = poor user experience
                    - Use Crashlytics to track null pointer crashes
                    """.trimIndent()
                ))
            }
        }
    }
}

