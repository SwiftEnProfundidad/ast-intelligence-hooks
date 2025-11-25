package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class DispatcherMainForUIRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseDispatcherMainForUI", severity = Severity.Defect, description = "UI updates must use Dispatchers.Main", debt = Debt.FIVE_MINS)
}
