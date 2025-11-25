// ═══════════════════════════════════════════════════════════════
// Sealed Classes for UI State
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.sealed

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class SealedClassForStateRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "UseSealedClassForState",
        severity = Severity.CodeSmell,
        description = "UI state should use sealed classes",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val className = klass.name ?: return
        val isDataClass = klass.isData()
        val isSealed = klass.isSealed()
        
        if (className.endsWith("State") && isDataClass && !isSealed) {
            val properties = klass.getProperties()
            val hasLoadingFlag = properties.any { it.name == "isLoading" }
            val hasErrorProp = properties.any { it.name?.contains("error", ignoreCase = true) == true }
            
            if (hasLoadingFlag || hasErrorProp) {
                report(CodeSmell(
                    issue,
                    Entity.from(klass),
                    """
                    State class using boolean flags instead of sealed class
                    
                    Problem: Multiple states can be active simultaneously
                    
                    ❌ Bad - Can be loading AND have error:
                    data class OrderState(
                        val order: Order? = null,
                        val isLoading: Boolean = false,
                        val error: String? = null
                    )
                    
                    ✅ Good - Only one state at a time:
                    sealed class OrderState {
                        data object Loading : OrderState()
                        data class Success(val order: Order) : OrderState()
                        data class Error(val message: String) : OrderState()
                    }
                    
                    Benefits:
                    - Impossible states are unrepresentable
                    - Exhaustive when expressions
                    - Type-safe state handling
                    - Better Compose integration
                    
                    Pattern in ViewModel:
                    private val _state = MutableStateFlow<OrderState>(OrderState.Loading)
                    val state: StateFlow<OrderState> = _state.asStateFlow()
                    
                    Pattern in Composable:
                    when (state) {
                        is OrderState.Loading -> LoadingIndicator()
                        is OrderState.Success -> OrderDetails(state.order)
                        is OrderState.Error -> ErrorMessage(state.message)
                    }
                    """.trimIndent()
                ))
            }
        }
    }
}

