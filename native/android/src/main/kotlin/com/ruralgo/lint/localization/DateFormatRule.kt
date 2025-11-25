package com.ruralgo.lint.localization
import io.gitlab.arturbosch.detekt.api.*
class DateFormatRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "DateFormatRule", severity = Severity.Warning, description = "Localization best practices", debt = Debt.TEN_MINS)
}
