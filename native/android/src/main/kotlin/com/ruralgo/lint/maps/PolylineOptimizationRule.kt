package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class PolylineOptimizationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "PolylineOptimization",
        severity = Severity.CodeSmell,
        description = "Large polylines (>1000 points) should be simplified for performance",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("addPolyline") && callText.contains(".size") && !callText.contains("simplify")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "Large polyline without simplification - use Douglas-Peucker algorithm to reduce points"
            ))
        }
    }
}
