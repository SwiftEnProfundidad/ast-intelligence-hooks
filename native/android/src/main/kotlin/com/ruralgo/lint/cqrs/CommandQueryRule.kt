// ═══════════════════════════════════════════════════════════════
// CQRS - Command/Query Separation Validator
// ═══════════════════════════════════════════════════════════════
// Detects: Queries with side effects, Commands returning data

package com.ruralgo.lint.cqrs

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.*

class CommandQueryRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "CQRSSeparation",
        severity = Severity.Defect,
        description = "Queries should not have side effects. Commands should not return data.",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val name = function.name ?: return
        
        // Classify as Command or Query
        val isCommand = isCommandMethod(name)
        val isQuery = isQueryMethod(name)
        
        if (!isCommand && !isQuery) return
        
        if (isQuery) {
            // Queries should NOT have side effects
            val hasSideEffects = detectSideEffects(function)
            
            if (hasSideEffects) {
                report(CodeSmell(
                    issue,
                    Entity.from(function),
                    """
                    CQRS Violation: Query method '$name' has side effects.
                    
                    CQRS Rule: Queries should only READ, never WRITE.
                    
                    Problem: Query modifies state or calls mutating methods.
                    
                    Detected side effects:
                    - Property assignments
                    - Mutating method calls
                    - State modifications
                    
                    Refactor:
                    1. Separate read and write:
                       // Query (read only)
                       suspend fun getOrders(): List<Order> {
                           return repository.fetch()  // No mutations
                       }
                       
                       // Command (write only)
                       suspend fun updateOrderCache(orders: List<Order>) {
                           cache = orders  // Mutation in separate method
                       }
                    
                    2. If caching is needed, use StateFlow:
                       private val _orders = MutableStateFlow<List<Order>>(emptyList())
                       val orders: StateFlow<List<Order>> = _orders
                       
                       suspend fun fetchOrders(): List<Order> {
                           val orders = repository.fetch()
                           // Update flow separately
                           return orders
                       }
                    
                    Benefits:
                    - Predictable (queries don't change state)
                    - Testable (no hidden side effects)
                    - Cacheable (queries are idempotent)
                    """.trimIndent()
                ))
            }
        } else if (isCommand) {
            // Commands should NOT return data
            val returnsData = detectDataReturn(function)
            
            if (returnsData) {
                report(CodeSmell(
                    issue.copy(severity = Severity.Warning),
                    Entity.from(function),
                    """
                    CQRS Violation: Command method '$name' returns data.
                    
                    CQRS Rule: Commands should WRITE, not return business data.
                    
                    Allowed returns for Commands:
                    - Unit
                    - Boolean (success flag)
                    - Result<Unit, Error>
                    - ID (String, Long, UUID)
                    
                    NOT allowed:
                    - Full entities (User, Order, etc.)
                    - Lists of data
                    - DTOs with business data
                    
                    Refactor:
                    // BEFORE (violation):
                    suspend fun createOrder(order: Order): Order {
                        val saved = repository.save(order)
                        return saved  // ❌ Returns data
                    }
                    
                    // AFTER (CQRS compliant):
                    suspend fun createOrder(order: Order): String {
                        val id = repository.save(order)
                        return id  // ✅ Returns only ID
                    }
                    
                    // Separate query:
                    suspend fun getOrder(id: String): Order {
                        return repository.fetch(id)
                    }
                    
                    Benefits:
                    - Clear separation (write vs read)
                    - Scalable (can optimize separately)
                    - Cacheable (queries independent)
                    """.trimIndent()
                ))
            }
        }
    }
    
    private fun isCommandMethod(name: String): Boolean {
        val commandPrefixes = listOf("create", "update", "delete", "add", "remove", "set", "save", "insert")
        return commandPrefixes.any { name.lowercase().startsWith(it) }
    }
    
    private fun isQueryMethod(name: String): Boolean {
        val queryPrefixes = listOf("get", "fetch", "find", "load", "list", "search", "query")
        return queryPrefixes.any { name.lowercase().startsWith(it) }
    }
    
    private fun detectSideEffects(function: KtNamedFunction): Boolean {
        var hasSideEffects = false
        
        function.bodyExpression?.accept(object : KtTreeVisitorVoid() {
            override fun visitBinaryExpression(expression: KtBinaryExpression) {
                // Check for assignments
                if (expression.operationToken.toString() == "EQ") {
                    hasSideEffects = true
                }
                super.visitBinaryExpression(expression)
            }
            
            override fun visitCallExpression(expression: KtCallExpression) {
                // Check for mutating method calls (add, remove, clear, etc.)
                val callee = expression.calleeExpression?.text
                val mutatingMethods = listOf("add", "remove", "clear", "set", "put", "append")
                if (callee in mutatingMethods) {
                    hasSideEffects = true
                }
                super.visitCallExpression(expression)
            }
        })
        
        return hasSideEffects
    }
    
    private fun detectDataReturn(function: KtNamedFunction): Boolean {
        val returnType = function.typeReference?.text ?: return false
        
        // Allowed return types for commands
        val allowedReturns = listOf("Unit", "Boolean", "Result", "ID", "String", "Long", "UUID")
        
        return !allowedReturns.any { returnType.contains(it) }
    }
}

