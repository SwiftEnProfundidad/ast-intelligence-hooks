// ═══════════════════════════════════════════════════════════════
// Safe Call Chain Readability
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.nullsafety

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class SafeCallChainRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "SafeCallChainReadability",
        severity = Severity.CodeSmell,
        description = "Long safe call chains hurt readability",
        debt = Debt.TEN_MINS
    )
    
    private fun countSafeCalls(expression: KtExpression): Int {
        var count = 0
        var current: KtExpression? = expression
        
        while (current is KtSafeQualifiedExpression) {
            count++
            current = current.receiverExpression
        }
        
        return count
    }
    
    override fun visitSafeQualifiedExpression(expression: KtSafeQualifiedExpression) {
        super.visitSafeQualifiedExpression(expression)
        
        val chainLength = countSafeCalls(expression)
        
        if (chainLength > 3) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                """
                Long safe call chain ($chainLength levels)
                
                Problem: Hard to read and maintain
                
                ❌ Too many safe calls:
                val city = user?.address?.country?.capital?.name
                
                ✅ Better alternatives:
                
                1. Use let for scoped access:
                val city = user?.address?.let { address ->
                    address.country?.capital?.name
                }
                
                2. Early return pattern:
                val address = user?.address ?: return
                val country = address.country ?: return
                val city = country.capital?.name
                
                3. Extract to function:
                fun getCityName(user: User?): String? {
                    val address = user?.address ?: return null
                    val country = address.country ?: return null
                    return country.capital?.name
                }
                
                Benefits:
                - More readable
                - Easier to debug
                - Better error handling
                - Testable intermediate steps
                """.trimIndent()
            ))
        }
    }
}

