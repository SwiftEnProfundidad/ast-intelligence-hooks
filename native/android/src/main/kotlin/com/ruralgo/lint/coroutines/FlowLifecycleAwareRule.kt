package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class FlowLifecycleAwareRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "LifecycleAwareFlowCollection", severity = Severity.Defect, description = "Collect flows lifecycle-aware", debt = Debt.TEN_MINS)
}
