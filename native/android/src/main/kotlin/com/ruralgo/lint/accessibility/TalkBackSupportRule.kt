package com.ruralgo.lint.accessibility
import io.gitlab.arturbosch.detekt.api.*
class TalkBackSupportRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "TalkBackSupportRule", severity = Severity.Warning, description = "Accessibility best practices", debt = Debt.TEN_MINS)
}
