package com.ruralgo.lint.images

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class BitmapCompressionRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "BitmapCompression",
        severity = Severity.CodeSmell,
        description = "Compress bitmaps before upload for rural bandwidth",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (callText.contains("upload") && callText.contains("Bitmap") && !callText.contains("compress")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "Bitmap upload without compression - use bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)"
            ))
        }
    }
}
