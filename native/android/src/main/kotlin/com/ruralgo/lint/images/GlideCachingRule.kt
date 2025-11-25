package com.ruralgo.lint.images

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class GlideCachingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "GlideCaching",
        severity = Severity.Minor,
        description = "Configure Glide/Coil caching for rural re-downloads",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if ((callText.contains("Glide.with") || callText.contains("Coil")) && callText.contains("load(")) {
            if (!callText.contains("diskCacheStrategy") && !callText.contains("memoryCachePolicy")) {
                report(CodeSmell(
                    issue,
                    Entity.from(expression),
                    "Image loading without cache config - configure diskCacheStrategy(ALL) for rural offline viewing"
                ))
            }
        }
    }
}
