package com.ruralgo.lint.testing
import io.gitlab.arturbosch.detekt.api.*
class ComposeUITestRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ComposeUITestRule", severity = Severity.CodeSmell, description = "Testing best practices", debt = Debt.TEN_MINS)
}
