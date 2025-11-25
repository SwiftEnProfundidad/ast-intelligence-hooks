// ═══════════════════════════════════════════════════════════════
// Extension Functions Over Inheritance
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.extensions

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.lexer.KtTokens

class ExtensionFunctionOverInheritanceRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "PreferExtensionFunctions",
        severity = Severity.CodeSmell,
        description = "Consider extension functions over inheritance",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val superTypeList = klass.getSuperTypeList() ?: return
        val superTypes = superTypeList.entries
        
        if (superTypes.size == 1) {
            val singleFunction = klass.declarations.filterIsInstance<KtNamedFunction>()
                .filter { !it.hasModifier(KtTokens.OVERRIDE_KEYWORD) }
            
            if (singleFunction.size == 1 && !klass.hasModifier(KtTokens.ABSTRACT_KEYWORD)) {
                report(CodeSmell(
                    issue,
                    Entity.from(klass),
                    """
                    Single-method subclass - consider extension function
                    
                    Problem: Unnecessary inheritance, tighter coupling
                    
                    ❌ Over-engineering with inheritance:
                    class OrderValidator : BaseValidator() {
                        fun validateOrder(order: Order): Boolean {
                            return order.amount > 0 && order.items.isNotEmpty()
                        }
                    }
                    
                    ✅ Better with extension:
                    fun Order.isValid(): Boolean {
                        return amount > 0 && items.isNotEmpty()
                    }
                    
                    Benefits:
                    - No inheritance hierarchy
                    - Better discoverability (IDE autocomplete)
                    - Doesn't pollute class namespace
                    - Can't be overridden (more predictable)
                    - Works with final classes (String, List, etc.)
                    
                    Extension function examples:
                    // String extensions
                    fun String.isValidEmail(): Boolean {
                        return contains("@") && contains(".")
                    }
                    
                    // List extensions
                    fun <T> List<T>.secondOrNull(): T? = getOrNull(1)
                    
                    // Domain model extensions
                    fun User.fullName(): String = "${'$'}firstName ${'$'}lastName"
                    
                    // ViewModel extensions
                    fun OrderViewModel.loadOrders() {
                        viewModelScope.launch {
                            repository.getOrders()
                        }
                    }
                    
                    When to use inheritance:
                    - Polymorphism needed
                    - Multiple related methods
                    - Need to override behavior
                    - Framework requires it (ViewModel, etc.)
                    
                    Composition over inheritance:
                    class OrderService(
                        private val validator: OrderValidator,
                        private val repository: OrderRepository
                    )
                    """.trimIndent()
                ))
            }
        }
    }
}

