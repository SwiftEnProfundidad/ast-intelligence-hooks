// ═══════════════════════════════════════════════════════════════
// DIP: Dependency Inversion Principle - Concrete Dependency Detector
// ═══════════════════════════════════════════════════════════════
// Detects ViewModels/UseCases depending on concrete implementations
// instead of interfaces (Hilt DI pattern)

package com.ruralgo.lint.solid

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.*

class DIPHiltRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "DIPConcreteDependency",
        severity = Severity.Defect,
        description = "High-level modules should depend on interfaces, not concrete types (DIP + Hilt)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val name = klass.name ?: return
        
        // Only check high-level modules (ViewModel, UseCase)
        val isHighLevel = name.endsWith("ViewModel") || name.endsWith("UseCase")
        if (!isHighLevel) return
        
        // Check @Inject constructor parameters
        val primaryConstructor = klass.primaryConstructor ?: return
        
        primaryConstructor.valueParameters.forEach { parameter ->
            val paramName = parameter.name ?: return@forEach
            val paramType = parameter.typeReference?.text ?: return@forEach
            
            // Check if parameter is concrete service/repository
            val isConcrete = (paramType.endsWith("Service") ||
                            paramType.endsWith("Repository") ||
                            paramType.endsWith("Manager") ||
                            paramType.endsWith("Client")) &&
                            !paramType.endsWith("Protocol") &&
                            !paramType.startsWith("I")  // Not interface-named
            
            if (isConcrete) {
                report(CodeSmell(
                    issue,
                    Entity.from(parameter),
                    """
                    Parameter '$paramName: $paramType' depends on concrete type - violates DIP.
                    
                    DIP Principle: High-level should depend on abstractions, not details.
                    
                    Current:
                    @Inject constructor(
                        private val $paramName: $paramType  // ← Concrete
                    )
                    
                    Refactor:
                    1. Create interface:
                       interface ${paramType}Interface {
                           // Interface methods
                       }
                    
                    2. Make concrete implement:
                       class $paramType @Inject constructor(
                           // ...
                       ) : ${paramType}Interface {
                           // Implementation
                       }
                    
                    3. Inject interface with @Binds:
                       @Module
                       @InstallIn(ViewModelComponent::class)
                       abstract class RepositoryModule {
                           @Binds
                           abstract fun bind${paramType}(
                               impl: $paramType
                           ): ${paramType}Interface
                       }
                    
                    4. Use interface:
                       @Inject constructor(
                           private val $paramName: ${paramType}Interface  // ← Interface
                       )
                    
                    Benefits:
                    - Testable (inject fakes)
                    - Flexible (swap implementations)
                    - Loosely coupled
                    """.trimIndent()
                ))
            }
        }
    }
}

