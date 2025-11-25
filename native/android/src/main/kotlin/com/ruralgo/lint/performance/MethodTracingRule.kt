package com.ruralgo.lint.performance
import io.gitlab.arturbosch.detekt.api.*
class MethodTracingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "MethodTracingRule", severity = Severity.Performance, description = "Performance best practices", debt = Debt.TEN_MINS)
}
