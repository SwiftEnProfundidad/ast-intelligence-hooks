package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class SharedFlowForEventsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseSharedFlowForEvents", severity = Severity.CodeSmell, description = "Use SharedFlow for events", debt = Debt.TEN_MINS)
}
