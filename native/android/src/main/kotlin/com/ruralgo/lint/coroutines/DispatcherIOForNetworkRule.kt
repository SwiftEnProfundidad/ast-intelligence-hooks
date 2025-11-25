package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class DispatcherIOForNetworkRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseDispatcherIOForNetwork", severity = Severity.Warning, description = "Use Dispatchers.IO for network operations", debt = Debt.FIVE_MINS)
}
