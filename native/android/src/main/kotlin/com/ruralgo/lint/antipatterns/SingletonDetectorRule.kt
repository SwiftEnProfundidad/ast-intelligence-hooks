// ═══════════════════════════════════════════════════════════════
// Anti-Pattern: Singleton Detection (object declarations)
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.antipatterns

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class SingletonDetectorRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "NoSingletonPattern",
        severity = Severity.Defect,
        description = "Singletons violate DIP. Use Dependency Injection (Hilt) instead.",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitObjectDeclaration(declaration: KtObjectDeclaration) {
        super.visitObjectDeclaration(declaration)
        
        val name = declaration.name ?: return
        
        // Check if companion object with getInstance() or similar
        if (declaration.isCompanion()) {
            val hasInstanceMethod = declaration.declarations.any { decl ->
                (decl as? KtNamedFunction)?.name in listOf("getInstance", "instance", "shared")
            }
            
            if (hasInstanceMethod) {
                report(CodeSmell(
                    issue,
                    Entity.from(declaration),
                    """
                    Singleton detected via companion object
                    
                    Problem: Violates Dependency Inversion, hard to test
                    
                    Refactor to Hilt DI:
                    
                    // BEFORE:
                    class OrderService {
                        companion object {
                            fun getInstance() = INSTANCE
                        }
                    }
                    
                    // AFTER:
                    @Singleton
                    class OrderService @Inject constructor() {
                        // Normal class, injected by Hilt
                    }
                    
                    // Usage:
                    class OrderViewModel @Inject constructor(
                        private val orderService: OrderService
                    )
                    """.trimIndent()
                ))
            }
        }
    }
}

