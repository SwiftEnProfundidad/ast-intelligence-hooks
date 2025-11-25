package com.ruralgo.lint.accessibility
import io.gitlab.arturbosch.detekt.api.*
class TextScalingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "TextScalingRule", severity = Severity.Warning, description = "Accessibility best practices", debt = Debt.TEN_MINS)
}
