// ═══════════════════════════════════════════════════════════════
// Data Class equals/hashCode Validation
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.dataclasses

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class DataClassEqualsHashCodeRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "DataClassEqualsHashCode",
        severity = Severity.Warning,
        description = "Overriding equals/hashCode in data class is suspicious",
        debt = Debt.TEN_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        if (!klass.isData()) return
        
        val hasCustomEquals = klass.declarations.any { 
            it is KtNamedFunction && it.name == "equals"
        }
        
        val hasCustomHashCode = klass.declarations.any { 
            it is KtNamedFunction && it.name == "hashCode"
        }
        
        if (hasCustomEquals || hasCustomHashCode) {
            report(CodeSmell(
                issue,
                Entity.from(klass),
                """
                Data class with custom equals/hashCode
                
                Problem: Data classes auto-generate these methods
                
                ❌ Suspicious - Why override?:
                data class User(val id: String, val name: String) {
                    override fun equals(other: Any?): Boolean {
                        // Custom logic defeats data class purpose
                    }
                    
                    override fun hashCode(): Int {
                        // Custom logic
                    }
                }
                
                ✅ If you need custom equality:
                
                Option 1: Use regular class
                class User(val id: String, val name: String) {
                    override fun equals(other: Any?): Boolean {
                        if (this === other) return true
                        if (other !is User) return false
                        return id == other.id  // Only compare ID
                    }
                    
                    override fun hashCode(): Int = id.hashCode()
                }
                
                Option 2: Exclude properties from equality
                data class User(
                    val id: String,
                    val name: String
                ) {
                    // Properties not in constructor not included in equals
                    var lastSeen: Long = 0
                }
                
                Data class equality rules:
                - Only primary constructor properties
                - Structural equality (all properties)
                - Properties outside constructor ignored
                
                Example:
                val user1 = User("123", "John")
                val user2 = User("123", "John")
                println(user1 == user2)  // true (structural)
                println(user1 === user2) // false (referential)
                
                Common pitfalls:
                1. Comparing by ID only → use regular class
                2. Excluding certain properties → move outside constructor
                3. Custom comparison logic → don't use data class
                
                Remember:
                - equals and hashCode must be consistent
                - If a == b then a.hashCode() == b.hashCode()
                - Used by Sets, Maps, contains, etc.
                """.trimIndent()
            ))
        }
    }
}

