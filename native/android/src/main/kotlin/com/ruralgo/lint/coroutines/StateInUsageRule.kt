package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class StateInUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseStateInToConvert", severity = Severity.CodeSmell, description = "Use stateIn to convert cold to hot Flow", debt = Debt.TEN_MINS)
}
