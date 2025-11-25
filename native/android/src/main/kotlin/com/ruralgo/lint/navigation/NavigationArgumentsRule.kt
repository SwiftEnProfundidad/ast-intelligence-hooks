package com.ruralgo.lint.navigation
import io.gitlab.arturbosch.detekt.api.*
class NavigationArgumentsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "NavigationArgumentsRule", severity = Severity.CodeSmell, description = "Navigation best practices", debt = Debt.TEN_MINS)
}
