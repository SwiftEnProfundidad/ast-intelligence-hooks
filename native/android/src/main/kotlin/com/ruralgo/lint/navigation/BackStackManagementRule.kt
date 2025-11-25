package com.ruralgo.lint.navigation
import io.gitlab.arturbosch.detekt.api.*
class BackStackManagementRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "BackStackManagementRule", severity = Severity.CodeSmell, description = "Navigation best practices", debt = Debt.TEN_MINS)
}
