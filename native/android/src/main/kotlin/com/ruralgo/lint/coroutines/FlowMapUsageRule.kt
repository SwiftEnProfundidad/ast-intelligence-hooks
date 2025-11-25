package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class FlowMapUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseFlowMapForTransform", severity = Severity.CodeSmell, description = "Use Flow.map for transformations", debt = Debt.FIVE_MINS)
}
