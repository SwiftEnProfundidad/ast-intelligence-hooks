package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class StateHoistingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ComposeStateHoisting", severity = Severity.CodeSmell, description = "Hoist state to appropriate level in Compose", debt = Debt.TEN_MINS)
}
