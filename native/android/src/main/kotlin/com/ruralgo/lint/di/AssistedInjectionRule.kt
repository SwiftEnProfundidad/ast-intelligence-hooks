package com.ruralgo.lint.di

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class AssistedInjectionRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "AssistedInjectionRule",
        severity = Severity.CodeSmell,
        description = "Use @AssistedInject for runtime parameters (Hilt best practice)",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val constructorParams = klass.primaryConstructor?.valueParameters ?: return
        
        val hasInject = klass.annotationEntries.any { it.shortName?.asString() == "Inject" }
        val hasRuntimeParam = constructorParams.any { param ->
            val paramName = param.name ?: ""
            paramName.contains("id", ignoreCase = true) ||
            paramName.contains("data", ignoreCase = true) ||
            param.typeReference?.text?.let { it == "String" || it == "Int" || it == "UUID" } == true
        }
        
        if (hasInject && hasRuntimeParam && !klass.text.contains("@AssistedInject")) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(klass),
                    """
                    Consider @AssistedInject for runtime parameters.
                    
                    Example:
                    ```kotlin
                    class MyViewModel @AssistedInject constructor(
                        private val repository: Repository,  // DI
                        @Assisted private val userId: String  // Runtime
                    ) : ViewModel() {
                        
                        @AssistedFactory
                        interface Factory {
                            fun create(userId: String): MyViewModel
                        }
                    }
                    ```
                    
                    Benefits: Type-safe factories, clean DI
                    """.trimIndent()
                )
            )
        }
    }
}

