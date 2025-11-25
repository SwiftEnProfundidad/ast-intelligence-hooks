package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class MarkerPerformanceRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "MarkerPerformance",
        severity = Severity.Defect,
        description = "Adding markers in loop causes performance issues - batch add markers",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitForExpression(expression: KtForExpression) {
        super.visitForExpression(expression)
        
        val loopText = expression.text
        if (loopText.contains("addMarker") || loopText.contains("Marker(")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "Markers added in loop - batch marker additions for performance: markers.map { MarkerOptions().position(it) }.also { map.addMarkers(it) }"
            ))
        }
    }
}
