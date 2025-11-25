package com.ruralgo.lint.geofence

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class GeofencePermissionsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "GeofencePermissions",
        severity = Severity.Defect,
        description = "Geofencing requires ACCESS_BACKGROUND_LOCATION permission (Android 10+)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("addGeofences")) {
            val containingFile = expression.containingKtFile.text
            if (!containingFile.contains("ACCESS_BACKGROUND_LOCATION")) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    "Geofencing without background location permission - request ACCESS_BACKGROUND_LOCATION for Android 10+"
                ))
            }
        }
    }
}
