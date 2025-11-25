package com.ruralgo.lint.localization
import io.gitlab.arturbosch.detekt.api.*
class PluralsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "PluralsRule", severity = Severity.Warning, description = "Localization best practices", debt = Debt.TEN_MINS)
}
