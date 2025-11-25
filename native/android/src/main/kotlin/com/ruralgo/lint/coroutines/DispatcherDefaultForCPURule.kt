package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class DispatcherDefaultForCPURule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseDispatcherDefaultForCPU", severity = Severity.Warning, description = "Use Dispatchers.Default for CPU-intensive work", debt = Debt.FIVE_MINS)
}
