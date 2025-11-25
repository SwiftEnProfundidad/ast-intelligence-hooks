package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class StateFlowForStateRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseStateFlowForState", severity = Severity.CodeSmell, description = "Use StateFlow for state representation", debt = Debt.TEN_MINS)
}
