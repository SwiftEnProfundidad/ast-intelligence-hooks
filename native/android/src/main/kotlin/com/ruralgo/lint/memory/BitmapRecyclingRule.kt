package com.ruralgo.lint.memory

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.getParentOfType

class BitmapRecyclingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "BitmapRecyclingRule",
        severity = Severity.Performance,
        description = "Large bitmaps must be recycled (OutOfMemoryError prevention)",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        
        if (callText.contains("BitmapFactory.decode") || callText.contains("Bitmap.createBitmap")) {
            val containingFunction = expression.getParentOfType<KtNamedFunction>(true)
            val functionText = containingFunction?.text ?: ""
            
            val hasRecycle = functionText.contains(".recycle()") ||
                            functionText.contains("use {") ||
                            functionText.contains("Coil") ||
                            functionText.contains("Glide")
            
            if (!hasRecycle) {
                report(
                    CodeSmell(
                        issue,
                        Entity.from(expression),
                        """
                        🚨 HIGH: Bitmap Not Recycled - Memory Leak
                        
                        Large bitmaps consume massive memory.
                        Must recycle when done.
                        
                        SOLUTION:
                        ```kotlin
                        val bitmap = BitmapFactory.decodeResource(resources, R.drawable.large)
                        try {
                            // Use bitmap
                        } finally {
                            bitmap.recycle()  // ✅ Free memory
                        }
                        ```
                        
                        BETTER: Use Coil/Glide (handles recycling):
                        ```kotlin
                        AsyncImage(
                            model = imageUrl,
                            contentDescription = null
                        )
                        ```
                        
                        Prevents OutOfMemoryError crashes.
                        """.trimIndent()
                    )
                )
            }
        }
    }
}

