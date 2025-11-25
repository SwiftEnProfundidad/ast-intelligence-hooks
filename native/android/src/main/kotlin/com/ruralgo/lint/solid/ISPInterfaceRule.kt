// ═══════════════════════════════════════════════════════════════
// ISP: Interface Segregation Principle - Fat Interface Detector
// ═══════════════════════════════════════════════════════════════
// Detects interfaces with too many methods

package com.ruralgo.lint.solid

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class ISPInterfaceRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "ISPFatInterface",
        severity = Severity.CodeSmell,
        description = "Interfaces with too many methods violate ISP. Split into smaller, focused interfaces.",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        // Only check interfaces
        if (!klass.isInterface()) return
        
        val name = klass.name ?: return
        
        // Count methods
        val methods = klass.declarations.filterIsInstance<KtNamedFunction>()
        val methodCount = methods.size
        
        // Dynamic threshold: >10 methods
        if (methodCount > 10) {
            report(CodeSmell(
                issue,
                Entity.from(klass),
                """
                Interface '$name' has $methodCount methods - violates ISP.
                
                ISP Principle: Clients shouldn't depend on methods they don't use.
                
                Problem:
                - Implementing classes forced to implement all $methodCount methods
                - Many implementations likely stub unused methods
                - Changes to one method affect all implementations
                
                Refactor to Interface Composition:
                
                // Split by responsibility:
                interface UserReader {
                    fun list(): List<User>
                    fun search(query: String): List<User>
                }
                
                interface UserWriter {
                    suspend fun create(user: User)
                    suspend fun update(user: User)
                    suspend fun delete(id: String)
                }
                
                interface UserValidator {
                    fun validate(user: User): Boolean
                }
                
                // Compose as needed:
                interface UserRepository : UserReader, UserWriter
                
                Benefits:
                - Smaller, focused interfaces
                - Implementations only implement what they need
                - Better testability
                """.trimIndent()
            ))
        }
    }
}

