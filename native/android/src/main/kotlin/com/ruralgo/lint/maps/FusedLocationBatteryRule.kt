package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class FusedLocationBatteryRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "FusedLocationBattery",
        severity = Severity.Defect,
        description = "FusedLocationProvider must use appropriate priority for battery efficiency",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("requestLocationUpdates")) {
            if (!callText.contains("PRIORITY_BALANCED") && !callText.contains("PRIORITY_LOW") && callText.contains("PRIORITY_HIGH")) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    "Location updates with HIGH_ACCURACY - high battery drain, use PRIORITY_BALANCED for rural logistics"
                ))
            }
        }
    }
}
