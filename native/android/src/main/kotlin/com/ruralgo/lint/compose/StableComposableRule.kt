package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class StableComposableRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "StableComposableParams", severity = Severity.Performance, description = "Composable parameters should be stable", debt = Debt.TWENTY_MINS)
}
