package com.ruralgo.lint.kotlin.coroutines
import io.gitlab.arturbosch.detekt.api.*
class StructuredConcurrencyRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseStructuredConcurrency", severity = Severity.Warning, description = "Use structured concurrency scopes", debt = Debt.TEN_MINS)
}
