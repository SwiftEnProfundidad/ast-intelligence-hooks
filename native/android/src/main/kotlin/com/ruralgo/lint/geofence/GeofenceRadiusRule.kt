package com.ruralgo.lint.geofence

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class GeofenceRadiusRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "GeofenceRadiusBattery",
        severity = Severity.CodeSmell,
        description = "Small geofence radius (<100m) drains battery",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("setCircularRegion")) {
            val radiusMatch = Regex("setCircularRegion\\([^,]+,\\s*[^,]+,\\s*(\\d{1,2})f").find(callText)
            if (radiusMatch != null) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    "Geofence radius <100m - high battery impact, use minimum 100m for efficiency"
                ))
            }
        }
    }
}
