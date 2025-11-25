package com.ruralgo.lint.compose

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class RememberKeyRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "RememberKeyRule",
        severity = Severity.Defect,
        description = "remember without stable keys causes excessive recomposition",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        
        if (callText.startsWith("remember {") || callText.startsWith("remember{")) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    🚨 HIGH: remember Without Key
                    
                    Recomputes on EVERY recomposition.
                    
                    ADD KEY:
                    ```kotlin
                    val result = remember(userId, filter) {
                        expensiveCalculation()
                    }
                    ```
                    
                    Keys:
                    - Unit: Once only
                    - userId: When userId changes
                    - Multiple: When any changes
                    
                    Performance: O(1) vs O(n recompositions)
                    """.trimIndent()
                )
            )
        }
    }
}

