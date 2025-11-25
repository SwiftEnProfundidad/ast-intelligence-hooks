package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class AndroidLocationPermissionsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "AndroidLocationPermissions",
        severity = Severity.Defect,
        description = "Location usage requires runtime permissions (ACCESS_FINE_LOCATION/COARSE_LOCATION)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("requestLocationUpdates") || callText.contains("getLastLocation")) {
            val containingFile = expression.containingKtFile.text
            if (!containingFile.contains("ACCESS_FINE_LOCATION") && !containingFile.contains("checkSelfPermission")) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    "Location usage without permission check - request ACCESS_FINE_LOCATION runtime permission"
                ))
            }
        }
    }
}
