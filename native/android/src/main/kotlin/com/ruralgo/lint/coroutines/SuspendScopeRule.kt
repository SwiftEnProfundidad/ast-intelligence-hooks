package com.ruralgo.lint.coroutines

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.getParentOfType

class SuspendScopeRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "SuspendScopeRule",
        severity = Severity.Defect,
        description = "suspend functions must be called from proper coroutine scope",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val calleeText = expression.calleeExpression?.text ?: return
        
        val isSuspendCall = expression.text.contains("suspend") ||
                           calleeText.startsWith("await") ||
                           expression.parent?.text?.contains("suspend") == true
        
        if (!isSuspendCall) return
        
        val containingFunction = expression.getParentOfType<KtNamedFunction>(true)
        val isSuspendFunction = containingFunction?.modifierList?.text?.contains("suspend") == true
        val hasCoroutineScope = containingFunction?.text?.contains("CoroutineScope") == true ||
                               containingFunction?.text?.contains("viewModelScope") == true ||
                               containingFunction?.text?.contains("lifecycleScope") == true ||
                               containingFunction?.text?.contains("launch") == true ||
                               containingFunction?.text?.contains("async") == true
        
        if (!isSuspendFunction && !hasCoroutineScope) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    🚨 CRITICAL: suspend Call Outside Coroutine Scope
                    
                    Call: $calleeText
                    
                    Problem: suspend function called from non-suspend context
                    
                    SOLUTIONS:
                    
                    1. Make function suspend:
                    ```kotlin
                    suspend fun loadData() {
                        val data = repository.fetch()  // ✅
                    }
                    ```
                    
                    2. Use viewModelScope:
                    ```kotlin
                    fun loadData() {
                        viewModelScope.launch {
                            val data = repository.fetch()  // ✅
                        }
                    }
                    ```
                    
                    3. Use lifecycleScope:
                    ```kotlin
                    fun loadData() {
                        lifecycleScope.launch {
                            val data = repository.fetch()  // ✅
                        }
                    }
                    ```
                    
                    This prevents crashes from improper suspend calls.
                    """.trimIndent()
                )
            )
        }
    }
}

