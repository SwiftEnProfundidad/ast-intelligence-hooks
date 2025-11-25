package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class FlowCatchRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseFlowCatch", severity = Severity.Warning, description = "Use catch for Flow error handling", debt = Debt.FIVE_MINS)
}
