package com.ruralgo.lint.testing
import io.gitlab.arturbosch.detekt.api.*
class ComposeTestTagRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ComposeTestTagRule", severity = Severity.CodeSmell, description = "Testing best practices", debt = Debt.TEN_MINS)
}
