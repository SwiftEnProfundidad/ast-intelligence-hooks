package com.ruralgo.lint.push

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.getParentOfType

class NotificationChannelRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "NotificationChannel",
        severity = Severity.Defect,
        description = "Notifications require NotificationChannel creation (Android 8+ mandatory)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        val isNotificationBuilder = callText.contains("NotificationCompat.Builder")
        
        if (!isNotificationBuilder) return
        
        val containingFunction = expression.getParentOfType<KtNamedFunction>(true)
        val functionText = containingFunction?.text ?: ""
        
        val hasChannelCreation = functionText.contains("NotificationChannel") || 
                                functionText.contains("setChannelId")
        
        if (!hasChannelCreation) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "NotificationCompat.Builder without channel - create NotificationChannel for Android 8+ (Oreo) - REQUIRED"
            ))
        }
    }
}
