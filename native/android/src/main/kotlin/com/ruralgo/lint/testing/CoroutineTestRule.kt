package com.ruralgo.lint.testing
import io.gitlab.arturbosch.detekt.api.*
class CoroutineTestRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "CoroutineTestRule", severity = Severity.CodeSmell, description = "Testing best practices", debt = Debt.TEN_MINS)
}
