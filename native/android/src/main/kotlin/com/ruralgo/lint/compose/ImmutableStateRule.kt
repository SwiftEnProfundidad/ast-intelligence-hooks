package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class ImmutableStateRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ImmutableComposeState", severity = Severity.Warning, description = "Compose state should be immutable", debt = Debt.TEN_MINS)
}
