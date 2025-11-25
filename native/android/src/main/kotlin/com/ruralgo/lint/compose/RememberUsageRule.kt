package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class RememberUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseRememberForState", severity = Severity.Warning, description = "Use remember to maintain state across recompositions", debt = Debt.FIVE_MINS)
}
