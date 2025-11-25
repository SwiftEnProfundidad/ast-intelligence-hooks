package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class NoManualDIRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "AvoidManualDI", severity = Severity.Warning, description = "Avoid manual DI, use Hilt", debt = Debt.TWENTY_MINS)
}
