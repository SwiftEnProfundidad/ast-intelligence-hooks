package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class MapCacheStrategyRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "MapCacheStrategy",
        severity = Severity.Minor,
        description = "Map tiles should be cached for offline rural viewing",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("GoogleMap") && !callText.contains("cacheEnabled") && !callText.contains("TileProvider")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "GoogleMap without tile caching - enable caching for offline rural support"
            ))
        }
    }
}
