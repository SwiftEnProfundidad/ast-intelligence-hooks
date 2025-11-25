package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class FlowCombineUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseFlowCombine", severity = Severity.CodeSmell, description = "Use combine for multiple flows", debt = Debt.TEN_MINS)
}
