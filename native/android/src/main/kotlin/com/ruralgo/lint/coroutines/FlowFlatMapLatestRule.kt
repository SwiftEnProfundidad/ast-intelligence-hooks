package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class FlowFlatMapLatestRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseFlatMapLatestForSearch", severity = Severity.CodeSmell, description = "Use flatMapLatest for search/autocomplete", debt = Debt.TEN_MINS)
}
