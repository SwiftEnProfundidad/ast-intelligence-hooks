// ═══════════════════════════════════════════════════════════════
// Clean Architecture - Layer Boundary Validator
// ═══════════════════════════════════════════════════════════════
// Detects violations of layer dependencies in Clean Architecture
// Domain → Data → Presentation
// Rule: Inner layers CANNOT depend on outer layers

package com.ruralgo.lint.architecture

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class LayerValidatorRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "CleanArchLayerBoundary",
        severity = Severity.Defect,
        description = "Inner layers cannot depend on outer layers. Domain must be independent.",
        debt = Debt.TWENTY_MINS
    )
    
    // Layer hierarchy (inner → outer)
    private enum class Layer(val order: Int) {
        DOMAIN(1),          // Core business logic (entities, use cases interfaces)
        DATA(2),            // Data layer (repositories impl, DAOs, APIs)
        PRESENTATION(3);    // UI layer (composables, viewmodels)
        
        fun canDependOn(other: Layer): Boolean {
            return when (this) {
                DOMAIN -> false  // Domain depends on NOTHING
                DATA -> other == DOMAIN  // Data can use Domain
                PRESENTATION -> other == DOMAIN || other == DATA  // Presentation can use both
            }
        }
    }
    
    override fun visitKtFile(file: KtFile) {
        super.visitKtFile(file)
        
        val filePath = file.virtualFile?.path ?: return
        val currentLayer = detectLayer(filePath) ?: return
        
        // Check import statements
        file.importDirectives.forEach { import ->
            val importPath = import.importPath?.pathStr ?: return@forEach
            val importedLayer = detectLayer(importPath) ?: return@forEach
            
            if (!currentLayer.canDependOn(importedLayer) && currentLayer != importedLayer) {
                report(CodeSmell(
                    issue,
                    Entity.from(import),
                    """
                    Clean Architecture violation: $currentLayer → $importedLayer
                    
                    Layer Hierarchy (inner → outer):
                    1. Domain (Entities, Use Cases, Repository interfaces)
                    2. Data (Repository implementations, DAOs, APIs)
                    3. Presentation (Composables, ViewModels)
                    
                    Current file: $currentLayer layer
                    Importing from: $importedLayer layer
                    
                    Rule: Inner layers cannot depend on outer layers.
                    
                    Allowed dependencies for $currentLayer:
                    ${getAllowedDependenciesText(currentLayer)}
                    
                    Problem: $currentLayer trying to import $importedLayer
                    
                    Solution:
                    1. If $importedLayer has logic needed by $currentLayer:
                       → Define interface in $currentLayer
                       → Implement in $importedLayer
                       → Use Dependency Inversion (DIP)
                    
                    2. If importing UI from business logic:
                       → NEVER do this
                       → Business logic must be UI-independent
                    
                    Example (Domain needs data):
                    // domain/repository/OrdersRepository.kt (interface)
                    interface OrdersRepository {
                        suspend fun fetch(): List<Order>
                    }
                    
                    // data/repository/OrdersRepositoryImpl.kt
                    class OrdersRepositoryImpl @Inject constructor(
                        private val dao: OrdersDao
                    ) : OrdersRepository {
                        // Implementation
                    }
                    """.trimIndent()
                ))
            }
        }
    }
    
    private fun detectLayer(path: String): Layer? {
        val lowercasedPath = path.lowercase()
        
        return when {
            lowercasedPath.contains("/domain/") -> Layer.DOMAIN
            lowercasedPath.contains("/data/") -> Layer.DATA
            lowercasedPath.contains("/presentation/") || 
            lowercasedPath.contains("/ui/") ||
            lowercasedPath.contains("viewmodel") -> Layer.PRESENTATION
            else -> null
        }
    }
    
    private fun getAllowedDependenciesText(layer: Layer): String {
        return when (layer) {
            Layer.DOMAIN -> "- NONE (independent)"
            Layer.DATA -> "- Domain"
            Layer.PRESENTATION -> "- Domain\n- Data"
        }
    }
}

