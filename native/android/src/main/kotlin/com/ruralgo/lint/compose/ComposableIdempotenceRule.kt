package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class ComposableIdempotenceRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ComposableIdempotence", severity = Severity.Warning, description = "Composables must be idempotent and side-effect free", debt = Debt.TWENTY_MINS)
}
