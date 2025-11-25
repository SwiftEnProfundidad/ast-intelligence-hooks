package com.ruralgo.lint.localization
import io.gitlab.arturbosch.detekt.api.*
class StringsXMLRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "StringsXMLRule", severity = Severity.Warning, description = "Localization best practices", debt = Debt.TEN_MINS)
}
