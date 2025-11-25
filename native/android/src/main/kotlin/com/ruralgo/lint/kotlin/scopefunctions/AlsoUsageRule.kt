package com.ruralgo.lint.kotlin.scopefunctions

import io.gitlab.arturbosch.detekt.api.*

class AlsoUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "UseAlsoForSideEffects",
        severity = Severity.CodeSmell,
        description = "Use also for side-effects - Context: it, Returns: context object",
        debt = Debt.FIVE_MINS
    )
}

