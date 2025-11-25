package com.ruralgo.lint.images

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class ImageResizingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "ImageResizing",
        severity = Severity.CodeSmell,
        description = "Resize images before upload to max dimensions",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if ((callText.contains("takePicture") || callText.contains("pickImage")) && 
            !callText.contains("createScaledBitmap") && !callText.contains("resize")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "Image capture without resize - use Bitmap.createScaledBitmap to max 1920x1080 before upload"
            ))
        }
    }
}
