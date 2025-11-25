package com.ruralgo.lint.accessibility
import io.gitlab.arturbosch.detekt.api.*
class TouchTargetSizeRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "TouchTargetSizeRule", severity = Severity.Warning, description = "Accessibility best practices", debt = Debt.TEN_MINS)
}
