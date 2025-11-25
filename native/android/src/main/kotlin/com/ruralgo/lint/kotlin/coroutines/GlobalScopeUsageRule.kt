package com.ruralgo.lint.kotlin.coroutines
import io.gitlab.arturbosch.detekt.api.*
class GlobalScopeUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "AvoidGlobalScope", severity = Severity.Defect, description = "Avoid GlobalScope, use structured concurrency", debt = Debt.TEN_MINS)
}
