package com.ruralgo.lint.push

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class FCMPermissionsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "FCMPermissions",
        severity = Severity.Defect,
        description = "FCM requires POST_NOTIFICATIONS runtime permission (Android 13+)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if (!callText.contains("FirebaseMessaging")) return
        
        val containingFile = expression.containingKtFile.text
        val hasPermissionCheck = containingFile.contains("POST_NOTIFICATIONS") ||
                               containingFile.contains("PERMISSION_GRANTED") ||
                               containingFile.contains("requestPermissions")
        
        if (!hasPermissionCheck) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "FCM without POST_NOTIFICATIONS permission check - request runtime permission for Android 13+ (Tiramisu)"
            ))
        }
    }
}
