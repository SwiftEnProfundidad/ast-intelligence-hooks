package com.ruralgo.lint.localization
import io.gitlab.arturbosch.detekt.api.*
class RTLSupportRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RTLSupportRule", severity = Severity.Warning, description = "Localization best practices", debt = Debt.TEN_MINS)
}
