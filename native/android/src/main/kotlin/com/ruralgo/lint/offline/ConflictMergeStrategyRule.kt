package com.ruralgo.lint.offline

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class ConflictMergeStrategyRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "ConflictMergeStrategy",
        severity = Severity.CodeSmell,
        description = "Data merge operations need conflict resolution strategy (timestamp-based, version-based)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val functionName = function.name ?: return
        val isMergeFunction = functionName.contains("merge", ignoreCase = true) || 
                             functionName.contains("sync", ignoreCase = true)
        
        if (!isMergeFunction) return
        
        val bodyText = function.bodyExpression?.text ?: ""
        val hasConflictResolution = bodyText.contains("conflict") || 
                                   bodyText.contains("timestamp") || 
                                   bodyText.contains("version") ||
                                   bodyText.contains("lastModified")
        
        if (!hasConflictResolution) {
            report(CodeSmell(
                issue,
                Entity.from(function),
                "Merge/sync function '${functionName}' without conflict strategy - implement version-based or timestamp-based conflict resolution"
            ))
        }
    }
}
