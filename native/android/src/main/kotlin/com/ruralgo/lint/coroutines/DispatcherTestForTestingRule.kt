package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class DispatcherTestForTestingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseTestDispatcher", severity = Severity.CodeSmell, description = "Use TestDispatcher in coroutine tests", debt = Debt.FIVE_MINS)
}
