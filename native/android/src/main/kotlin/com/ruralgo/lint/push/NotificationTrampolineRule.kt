package com.ruralgo.lint.push

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class NotificationTrampolineRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "NotificationTrampoline",
        severity = Severity.Defect,
        description = "Notification trampolines blocked in Android 12+ - use direct activity PendingIntent",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        val isPendingIntent = callText.contains("PendingIntent")
        
        if (!isPendingIntent) return
        
        val isTrampoline = (callText.contains("getBroadcast") || callText.contains("getService")) &&
                          callText.contains("startActivity")
        
        if (isTrampoline) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "Notification trampoline detected - Android 12+ blocks broadcast/service trampolines, use PendingIntent.getActivity() directly"
            ))
        }
    }
}
