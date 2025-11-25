// ═══════════════════════════════════════════════════════════════
// run Usage for Initialization with Context
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.scopefunctions

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class RunUsageRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "UseRunForInitialization",
        severity = Severity.CodeSmell,
        description = "Use run for object initialization with context - Context: this, Returns: lambda result",
        debt = Debt.FIVE_MINS
    )
}

