package com.ruralgo.lint.coroutines

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class LateinitValidationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "LateinitValidationRule",
        severity = Severity.Defect,
        description = "lateinit properties must be validated before use (Crash prevention)",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitProperty(property: KtProperty) {
        super.visitProperty(property)
        
        val hasLateinit = property.modifierList?.text?.contains("lateinit") == true
        
        if (hasLateinit) {
            val propertyName = property.name ?: return
            val classBody = property.parent?.parent?.text ?: ""
            
            val usages = Regex("\\b${propertyName}\\b").findAll(classBody).count()
            val validations = Regex("::${propertyName}\\.isInitialized").findAll(classBody).count()
            
            if (usages > 2 && validations == 0) {
                report(
                    CodeSmell(
                        issue,
                        Entity.from(property),
                        """
                        🚨 HIGH: lateinit Without Validation Check
                        
                        Property: $propertyName
                        
                        RISK: UninitializedPropertyAccessException
                        
                        ADD CHECK:
                        ```kotlin
                        if (::$propertyName.isInitialized) {
                            $propertyName.doSomething()
                        }
                        ```
                        
                        OR use nullable:
                        ```kotlin
                        private var $propertyName: Type? = null
                        ```
                        
                        Prevents production crashes.
                        """.trimIndent()
                    )
                )
            }
        }
    }
}

