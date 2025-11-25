package com.ruralgo.lint.compose

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class LazyColumnRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "LazyColumnRule",
        severity = Severity.Performance,
        description = "Large lists must use LazyColumn (Performance)",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        
        if (callText.startsWith("Column {") && callText.contains("items(")) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    🚨 HIGH: Column with Large List - Use LazyColumn
                    
                    Column renders ALL items at once.
                    LazyColumn renders only visible items.
                    
                    CHANGE:
                    ```kotlin
                    LazyColumn {
                        items(list) { item ->
                            ItemCard(item)
                        }
                    }
                    ```
                    
                    Performance: O(visible) vs O(total)
                    100 items: 60 FPS vs 10 FPS
                    """.trimIndent()
                )
            )
        }
    }
}

