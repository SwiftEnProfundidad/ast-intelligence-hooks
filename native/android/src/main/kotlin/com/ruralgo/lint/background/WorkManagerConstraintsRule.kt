package com.ruralgo.lint.background

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class WorkManagerConstraintsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "WorkManagerConstraints",
        severity = Severity.CodeSmell,
        description = "WorkManager tasks need appropriate constraints for battery",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        if ((callText.contains("OneTimeWorkRequest") || callText.contains("PeriodicWorkRequest")) && 
            !callText.contains("Constraints") && !callText.contains("setConstraints")) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "WorkManager without constraints - set network type, battery requirements for efficiency"
            ))
        }
    }
}
