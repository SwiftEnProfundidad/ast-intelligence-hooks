package com.ruralgo.lint.testing
import io.gitlab.arturbosch.detekt.api.*
class JUnit5OverJUnit4Rule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "JUnit5OverJUnit4Rule", severity = Severity.CodeSmell, description = "Testing best practices", debt = Debt.TEN_MINS)
}
