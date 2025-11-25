package com.ruralgo.lint.performance
import io.gitlab.arturbosch.detekt.api.*
class LazyColumnVirtualizationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseLazyColumnForLists", severity = Severity.Performance, description = "Use LazyColumn for large lists", debt = Debt.TEN_MINS)
}
