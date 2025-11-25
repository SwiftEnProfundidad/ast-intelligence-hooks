package com.ruralgo.lint.kotlin.coroutines
import io.gitlab.arturbosch.detekt.api.*
class SuspendFunctionNamingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "SuspendFunctionNaming", severity = Severity.CodeSmell, description = "Suspend functions naming conventions", debt = Debt.FIVE_MINS)
}
