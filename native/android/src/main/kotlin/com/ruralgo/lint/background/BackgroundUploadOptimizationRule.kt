package com.ruralgo.lint.background

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class BackgroundUploadOptimizationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "BackgroundUploadOptimization",
        severity = Severity.CodeSmell,
        description = "Background uploads should batch for efficiency",
        debt = Debt.TEN_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val bodyText = function.bodyExpression?.text ?: return
        if (function.name?.contains("Worker") == true && bodyText.contains("doWork")) {
            if (bodyText.contains("upload") && bodyText.contains("forEach") && 
                !bodyText.contains("chunked") && !bodyText.contains("batch")) {
                report(CodeSmell(
                    issue,
                    Entity.from(function),
                    "Background uploads in loop without batching - batch multiple files for network efficiency"
                ))
            }
        }
    }
}
