package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class RememberSaveableRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseRememberSaveable", severity = Severity.Warning, description = "Use rememberSaveable for process death survival", debt = Debt.FIVE_MINS)
}
