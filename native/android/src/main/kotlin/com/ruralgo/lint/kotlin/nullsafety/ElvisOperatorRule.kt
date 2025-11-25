// ═══════════════════════════════════════════════════════════════
// Elvis Operator Usage Recommendation
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.nullsafety

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class ElvisOperatorRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "SuggestElvisOperator",
        severity = Severity.CodeSmell,
        description = "Use Elvis operator (?:) for null-coalescing",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitIfExpression(expression: KtIfExpression) {
        super.visitIfExpression(expression)
        
        val condition = expression.condition as? KtBinaryExpression ?: return
        val thenBranch = expression.then ?: return
        val elseBranch = expression.`else` ?: return
        
        if (condition.operationToken.toString() == "EQEQ" || 
            condition.operationToken.toString() == "EXCLEQ") {
            
            val isNullCheck = condition.right?.text == "null" || condition.left?.text == "null"
            
            if (isNullCheck && 
                thenBranch.textLength < 50 && 
                elseBranch.textLength < 50) {
                
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    Consider using Elvis operator (?:)
                    
                    ❌ Verbose:
                    val name = if (user != null) user.name else "Unknown"
                    
                    ✅ Concise:
                    val name = user?.name ?: "Unknown"
                    
                    Benefits:
                    - More readable
                    - Idiomatic Kotlin
                    - Less code to maintain
                    
                    Elvis operator is perfect for:
                    - Default values
                    - Fallback expressions
                    - Early returns
                    
                    Example with early return:
                    val user = repository.getUser() ?: return
                    
                    Example with throw:
                    val user = repository.getUser() ?: throw UserNotFoundException()
                    """.trimIndent()
                ))
            }
        }
    }
}

