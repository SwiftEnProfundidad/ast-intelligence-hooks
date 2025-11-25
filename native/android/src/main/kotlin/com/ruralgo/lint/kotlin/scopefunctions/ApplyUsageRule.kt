package com.ruralgo.lint.kotlin.scopefunctions

import io.gitlab.arturbosch.detekt.api.*

class ApplyUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "UseApplyForConfiguration",
        severity = Severity.CodeSmell,
        description = "Use apply for object configuration - Context: this, Returns: context object",
        debt = Debt.FIVE_MINS
    )
}

