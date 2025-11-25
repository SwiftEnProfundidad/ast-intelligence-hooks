package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class FlowFilterUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseFlowFilterForFiltering", severity = Severity.CodeSmell, description = "Use Flow.filter for filtering", debt = Debt.FIVE_MINS)
}
