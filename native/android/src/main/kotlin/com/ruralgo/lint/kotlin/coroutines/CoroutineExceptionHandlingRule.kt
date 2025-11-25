package com.ruralgo.lint.kotlin.coroutines
import io.gitlab.arturbosch.detekt.api.*
class CoroutineExceptionHandlingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "CoroutineExceptionHandling", severity = Severity.Warning, description = "Proper exception handling in coroutines", debt = Debt.TEN_MINS)
}
