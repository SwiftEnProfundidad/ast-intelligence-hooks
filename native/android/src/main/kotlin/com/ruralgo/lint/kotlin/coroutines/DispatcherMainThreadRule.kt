package com.ruralgo.lint.kotlin.coroutines
import io.gitlab.arturbosch.detekt.api.*
class DispatcherMainThreadRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UIUpdatesOnMainThread", severity = Severity.Defect, description = "UI updates must be on Dispatchers.Main", debt = Debt.FIVE_MINS)
}
