package com.ruralgo.lint.kotlin.scopefunctions

import io.gitlab.arturbosch.detekt.api.*

class WithUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "UseWithForMultipleCalls",
        severity = Severity.CodeSmell,
        description = "Use with for multiple calls on same object - Context: this, Returns: lambda result",
        debt = Debt.FIVE_MINS
    )
}

