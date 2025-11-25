// ═══════════════════════════════════════════════════════════════
// let Usage for Null Safety and Transformations
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.scopefunctions

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class LetUsageRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "PreferLetForNullSafety",
        severity = Severity.CodeSmell,
        description = "Use let for null-safe operations and transformations",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitIfExpression(expression: KtIfExpression) {
        super.visitIfExpression(expression)
        
        val condition = expression.condition as? KtBinaryExpression ?: return
        val thenBranch = expression.then as? KtBlockExpression ?: return
        
        if (condition.operationToken.toString() == "EXCLEQ" && 
            condition.right?.text == "null") {
            
            val statements = thenBranch.statements
            if (statements.size <= 3) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    Explicit null check - consider using let
                    
                    ❌ Verbose:
                    if (user != null) {
                        val name = user.name
                        val email = user.email
                        updateUI(name, email)
                    }
                    
                    ✅ Concise with let:
                    user?.let { safeUser ->
                        val name = safeUser.name
                        val email = safeUser.email
                        updateUI(name, email)
                    }
                    
                    When to use let:
                    
                    1. Null safety with scope:
                       user?.let { 
                           println(it.name)
                       }
                    
                    2. Transform and use result:
                       val length = name?.let { it.length } ?: 0
                    
                    3. Execute multiple operations:
                       user?.let {
                           saveUser(it)
                           sendEmail(it)
                       }
                    
                    4. With elvis operator:
                       val user = repository.getUser()?.let { it } ?: return
                    
                    5. Shadowing variables:
                       user?.let { user ->
                           // Clear what 'user' refers to
                       }
                    
                    let characteristics:
                    - Context object: 'it' (or named)
                    - Return value: lambda result
                    - Perfect for: null-safety + transformation
                    
                    Example in ViewModel:
                    private fun loadUserProfile(userId: String) {
                        repository.getUser(userId)?.let { user ->
                            _state.value = ProfileState.Success(user)
                        } ?: run {
                            _state.value = ProfileState.Error("User not found")
                        }
                    }
                    """.trimIndent()
                ))
            }
        }
    }
}

