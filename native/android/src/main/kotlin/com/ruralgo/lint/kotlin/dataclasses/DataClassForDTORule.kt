// ═══════════════════════════════════════════════════════════════
// Data Classes for DTOs
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.dataclasses

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class DataClassForDTORule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "UseDat aClassForDTO",
        severity = Severity.Warning,
        description = "DTOs should be data classes",
        debt = Debt.TEN_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val className = klass.name ?: return
        val isDataClass = klass.isData()
        
        val isDTOClass = className.endsWith("Dto") || 
                         className.endsWith("DTO") || 
                         className.endsWith("Request") || 
                         className.endsWith("Response")
        
        if (isDTOClass && !isDataClass && !klass.isInterface() && !klass.isSealed()) {
            report(CodeSmell(
                issue,
                Entity.from(klass),
                """
                DTO class should be a data class
                
                Problem: Missing equals, hashCode, toString, copy
                
                ❌ Bad - Regular class for DTO:
                class OrderDto(
                    val id: String,
                    val amount: Double,
                    val status: String
                )
                
                ✅ Good - Data class provides:
                data class OrderDto(
                    val id: String,
                    val amount: Double,
                    val status: String
                )
                
                Data class benefits:
                1. Auto-generated equals() - structural equality
                2. Auto-generated hashCode() - for collections
                3. Auto-generated toString() - for debugging/logging
                4. Auto-generated copy() - for immutability
                5. Component functions - destructuring
                
                Example usage:
                // Structural equality
                val order1 = OrderDto("123", 100.0, "pending")
                val order2 = OrderDto("123", 100.0, "pending")
                println(order1 == order2)  // true
                
                // Immutable updates
                val updatedOrder = order1.copy(status = "completed")
                
                // Destructuring
                val (id, amount, status) = order1
                
                // Logging
                println(order1)  // OrderDto(id=123, amount=100.0, status=pending)
                
                When NOT to use data class:
                - Classes with behavior (use regular class)
                - Abstract classes
                - Sealed classes
                - Classes with var properties (prefer val)
                """.trimIndent()
            ))
        }
    }
}

