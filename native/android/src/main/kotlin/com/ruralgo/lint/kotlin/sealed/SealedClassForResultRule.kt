// ═══════════════════════════════════════════════════════════════
// Sealed Classes for Result Types
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.sealed

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class SealedClassForResultRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "UseSealedClassForResult",
        severity = Severity.CodeSmell,
        description = "Operation results should use sealed classes",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val returnType = function.typeReference?.text ?: return
        
        if (returnType.contains("Pair") || returnType.contains("Triple")) {
            val containsSuccessError = function.bodyExpression?.text?.let { body ->
                (body.contains("success", ignoreCase = true) || 
                 body.contains("error", ignoreCase = true)) &&
                body.contains("Pair") || body.contains("Triple")
            } ?: false
            
            if (containsSuccessError) {
                report(CodeSmell(
                    issue,
                    Entity.from(function),
                    """
                    Using Pair/Triple for operation result
                    
                    Problem: Unclear what each value means
                    
                    ❌ Bad - What does first/second mean?:
                    suspend fun createOrder(): Pair<Order?, String?> {
                        return try {
                            val order = api.createOrder()
                            Pair(order, null)
                        } catch (e: Exception) {
                            Pair(null, e.message)
                        }
                    }
                    
                    ✅ Good - Self-documenting:
                    sealed class Result<out T> {
                        data class Success<T>(val data: T) : Result<T>()
                        data class Error(val message: String, val cause: Throwable? = null) : Result<Nothing>()
                    }
                    
                    suspend fun createOrder(): Result<Order> {
                        return try {
                            val order = api.createOrder()
                            Result.Success(order)
                        } catch (e: Exception) {
                            Result.Error(e.message ?: "Unknown error", e)
                        }
                    }
                    
                    Usage in ViewModel:
                    when (val result = repository.createOrder()) {
                        is Result.Success -> _state.value = OrderState.Success(result.data)
                        is Result.Error -> _state.value = OrderState.Error(result.message)
                    }
                    
                    Benefits:
                    - Type-safe
                    - Self-documenting
                    - Exhaustive when
                    - Composable with other Results
                    """.trimIndent()
                ))
            }
        }
    }
}

