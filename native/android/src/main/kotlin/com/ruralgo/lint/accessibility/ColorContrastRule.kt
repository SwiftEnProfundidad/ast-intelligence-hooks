package com.ruralgo.lint.accessibility
import io.gitlab.arturbosch.detekt.api.*
class ColorContrastRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ColorContrastRule", severity = Severity.Warning, description = "Accessibility best practices", debt = Debt.TEN_MINS)
}
