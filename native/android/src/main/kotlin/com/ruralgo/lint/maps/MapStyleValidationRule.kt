package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class MapStyleValidationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "MapStyleValidation",
        severity = Severity.Minor,
        description = "Map should support dark mode with appropriate style",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("GoogleMap") && !callText.contains("mapProperties") && !callText.contains("isMyLocationEnabled")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "GoogleMap without style config - support dark mode: MapProperties(mapStyleOptions = if (isDark) darkStyle else lightStyle)"
            ))
        }
    }
}
