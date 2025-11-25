package com.ruralgo.lint.offline

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class WorkManagerOfflineRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "WorkManagerOfflineQueue",
        severity = Severity.Defect,
        description = "Background API calls must use WorkManager for reliable offline queue",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        val isCoroutineApiCall = callText.contains("CoroutineScope") && 
                                 callText.contains("launch") && 
                                 (callText.contains("api") || callText.contains("retrofit"))
        
        if (!isCoroutineApiCall) return
        
        val containingFile = expression.containingKtFile.text
        val hasWorkManager = containingFile.contains("WorkManager") ||
                           containingFile.contains("Worker") ||
                           containingFile.contains("OneTimeWorkRequest")
        
        if (!hasWorkManager) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "Background API call without WorkManager - use WorkManager for offline queue with automatic retry and battery optimization"
            ))
        }
    }
}
