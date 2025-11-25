package com.ruralgo.lint.geofence

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class GeofenceLimitRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "GeofenceLimit",
        severity = Severity.Defect,
        description = "Android allows max 100 geofences per app",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("addGeofences") && callText.contains("forEach")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "Geofences added in loop - Android limits to 100 geofences, prioritize closest locations"
            ))
        }
    }
}
