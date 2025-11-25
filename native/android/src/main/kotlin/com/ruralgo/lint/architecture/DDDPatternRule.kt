// ═══════════════════════════════════════════════════════════════
// DDD Pattern Matcher - Domain Model Validator
// ═══════════════════════════════════════════════════════════════
// Detects DDD anti-patterns: Anemic models, missing value objects

package com.ruralgo.lint.architecture

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.*

class DDDPatternRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "DDDAnemicModel",
        severity = Severity.CodeSmell,
        description = "Domain entities should have behavior, not just data (avoid anemic models)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        // Only check Domain layer
        val filePath = klass.containingKtFile.virtualFile?.path ?: return
        if (!filePath.contains("/domain/")) return
        
        // Skip DTOs
        if (filePath.contains("/dto") || filePath.contains("/response")) return
        
        val name = klass.name ?: return
        
        // Count properties vs methods
        val properties = klass.getProperties()
        val methods = klass.declarations.filterIsInstance<KtNamedFunction>()
            .filterNot { it.name == "equals" || it.name == "hashCode" || it.name == "toString" }
        
        val propertyCount = properties.size
        val methodCount = methods.size
        
        // Anemic if: >3 properties AND no business methods
        if (propertyCount > 3 && methodCount == 0) {
            report(CodeSmell(
                issue,
                Entity.from(klass),
                """
                Anemic Domain Model: '$name' has $propertyCount properties but no behavior.
                
                DDD Anti-Pattern: Anemic Domain Model
                Problem: Data structures without business logic
                
                Current structure:
                - Properties: $propertyCount
                - Business methods: 0
                
                DDD Rich Model (CORRECT):
                
                data class Order(
                    val id: OrderId,
                    private val _items: MutableList<OrderItem> = mutableListOf(),
                    var status: OrderStatus = OrderStatus.DRAFT
                ) {
                    val items: List<OrderItem> get() = _items.toList()
                    val total: Money get() = _items.sumOf { it.price }
                    
                    // ✅ BUSINESS LOGIC in domain model
                    fun addItem(item: OrderItem) {
                        require(status == OrderStatus.DRAFT) {
                            "Cannot modify submitted order"
                        }
                        _items.add(item)
                    }
                    
                    fun submit() {
                        require(_items.isNotEmpty()) { "Order must have items" }
                        require(total >= Money.MINIMUM_ORDER) {
                            "Order below minimum amount"
                        }
                        status = OrderStatus.SUBMITTED
                    }
                }
                
                Benefits of Rich Models:
                - Business rules in one place
                - Invariants enforced
                - Harder to misuse
                - Self-documenting
                
                Note: If this is a Value Object or DTO, move to appropriate folder.
                """.trimIndent()
            ))
        }
    }
}

