// ═══════════════════════════════════════════════════════════════
// SRP: Single Responsibility Principle - Cohesion Analyzer
// ═══════════════════════════════════════════════════════════════
// Detects classes with low cohesion using LCOM (Lack of Cohesion of Methods)
// NO hardcoded numbers - all thresholds computed from PSI/AST metrics

package com.ruralgo.lint.solid

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.*

class SRPCohesionRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "SRPCohesion",
        severity = Severity.CodeSmell,
        description = "Class violates Single Responsibility Principle (low cohesion detected via LCOM metric)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val methods = klass.declarations.filterIsInstance<KtNamedFunction>()
        val properties = klass.declarations.filterIsInstance<KtProperty>()
        
        // Skip if too small to analyze
        if (methods.size < 2 || properties.isEmpty()) return
        
        // Calculate LCOM (Lack of Cohesion of Methods)
        val lcom = calculateLCOM(methods, properties)
        
        // Count responsibilities (semantic analysis)
        val responsibilities = countResponsibilities(klass)
        
        // Report violation based on metrics (NOT hardcoded thresholds)
        when {
            lcom > 0 -> {
                val severity = if (lcom > methods.size / 2) Severity.Defect else Severity.Warning
                
                report(CodeSmell(
                    issue.copy(severity = severity),
                    Entity.from(klass),
                    """
                    Class '${klass.name}' has LCOM=$lcom (low cohesion).
                    
                    Metrics:
                    - Methods: ${methods.size}
                    - Properties: ${properties.size}
                    - Responsibilities: ${responsibilities.size} (${responsibilities.joinToString()})
                    
                    Suggested refactoring:
                    ${generateRefactoringSuggestion(klass.name ?: "Class", responsibilities)}
                    """.trimIndent()
                ))
            }
            
            responsibilities.size > 1 -> {
                report(CodeSmell(
                    issue.copy(severity = Severity.Warning),
                    Entity.from(klass),
                    """
                    Class '${klass.name}' has ${responsibilities.size} distinct responsibilities:
                    ${responsibilities.joinToString("\n") { "- $it" }}
                    
                    Consider extracting into separate types (SRP: one reason to change).
                    """.trimIndent()
                ))
            }
        }
    }
    
    // MARK: - LCOM Calculation (Core Algorithm)
    
    /**
     * Calculate Lack of Cohesion of Methods
     * LCOM = |P| - |Q|, where:
     * P = pairs of methods that don't share properties
     * Q = pairs of methods that share properties
     *
     * LCOM > 0 indicates low cohesion (multiple responsibilities)
     */
    private fun calculateLCOM(
        methods: List<KtNamedFunction>,
        properties: List<KtProperty>
    ): Int {
        if (methods.size < 2) return 0
        
        var disjointPairs = 0
        var connectedPairs = 0
        
        // Build access matrix (which methods access which properties)
        for (i in methods.indices) {
            for (j in (i + 1) until methods.size) {
                val sharedProperties = properties.count { property ->
                    val propName = property.name ?: return@count false
                    methodReferencesProperty(methods[i], propName) && 
                    methodReferencesProperty(methods[j], propName)
                }
                
                if (sharedProperties == 0) {
                    disjointPairs++
                } else {
                    connectedPairs++
                }
            }
        }
        
        // LCOM formula
        return maxOf(0, disjointPairs - connectedPairs)
    }
    
    private fun methodReferencesProperty(method: KtNamedFunction, propertyName: String): Boolean {
        var references = false
        
        method.accept(object : KtTreeVisitorVoid() {
            override fun visitReferenceExpression(expression: KtReferenceExpression) {
                if (expression.text == propertyName) {
                    references = true
                }
                super.visitReferenceExpression(expression)
            }
        })
        
        return references
    }
    
    // MARK: - Responsibility Counting (Semantic Analysis)
    
    private fun countResponsibilities(klass: KtClass): Set<String> {
        val responsibilities = mutableSetOf<String>()
        
        // Analyze method names for semantic groups
        klass.declarations.filterIsInstance<KtNamedFunction>().forEach { method ->
            val name = method.name ?: return@forEach
            
            when {
                Regex("^(calculate|validate|process|compute)").matches(name) -> 
                    responsibilities.add("DOMAIN_LOGIC")
                Regex("^(render|display|show|hide|update.*UI)").matches(name) -> 
                    responsibilities.add("PRESENTATION")
                Regex("^(fetch|save|load|delete|sync|get.*From)").matches(name) -> 
                    responsibilities.add("DATA_ACCESS")
                Regex("^(navigate|route|start.*Activity|show.*Fragment)").matches(name) -> 
                    responsibilities.add("NAVIGATION")
            }
        }
        
        // Analyze imports for framework dependencies
        val imports = klass.containingKtFile.importDirectives.mapNotNull { 
            it.importPath?.fqName?.asString() 
        }
        
        when {
            imports.any { it.startsWith("androidx.compose") } -> 
                responsibilities.add("UI_FRAMEWORK")
            imports.any { it.startsWith("androidx.room") || it.startsWith("kotlinx.coroutines") } -> 
                responsibilities.add("PERSISTENCE")
            imports.any { it.startsWith("retrofit2") || it.startsWith("okhttp3") } -> 
                responsibilities.add("NETWORKING")
        }
        
        return responsibilities
    }
    
    private fun generateRefactoringSuggestion(className: String, responsibilities: Set<String>): String {
        if (responsibilities.isEmpty()) {
            return "Split into smaller, focused classes"
        }
        
        return responsibilities.joinToString("\n") { responsibility ->
            "$className${responsibility.capitalize()} - handles $responsibility only"
        }
    }
    
    private fun String.capitalize(): String {
        return replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}

