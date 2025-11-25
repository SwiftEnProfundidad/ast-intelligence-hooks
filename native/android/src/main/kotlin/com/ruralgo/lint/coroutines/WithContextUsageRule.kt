package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class WithContextUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseWithContextForDispatcher", severity = Severity.CodeSmell, description = "Use withContext to switch dispatchers", debt = Debt.FIVE_MINS)
}
