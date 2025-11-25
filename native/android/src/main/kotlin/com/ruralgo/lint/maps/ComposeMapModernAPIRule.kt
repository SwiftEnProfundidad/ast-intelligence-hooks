package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class ComposeMapModernAPIRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "ComposeMapModernAPI",
        severity = Severity.CodeSmell,
        description = "Use Google Maps Compose library instead of AndroidView wrapping MapView",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("AndroidView") && callText.contains("MapView")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "AndroidView wrapping MapView - use Google Maps Compose: GoogleMap(cameraPositionState = ...) { Marker(...) }"
            ))
        }
    }
}
