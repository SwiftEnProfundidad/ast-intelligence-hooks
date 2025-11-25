package com.ruralgo.lint.push

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class BackgroundNotificationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "BackgroundNotification",
        severity = Severity.CodeSmell,
        description = "FCM background processing should use WorkManager for reliability",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val functionName = function.name ?: return
        if (functionName != "onMessageReceived") return
        
        val bodyText = function.bodyExpression?.text ?: ""
        val hasCoroutineScope = bodyText.contains("CoroutineScope") || bodyText.contains("launch")
        val hasWorkManager = bodyText.contains("WorkManager")
        
        if (hasCoroutineScope && !hasWorkManager) {
            report(CodeSmell(
                issue,
                Entity.from(function),
                "FCM onMessageReceived with CoroutineScope - use WorkManager for reliable background work (process death safe)"
            ))
        }
    }
}
