package com.ruralgo.lint.kotlin.coroutines
import io.gitlab.arturbosch.detekt.api.*
class CancellationCooperativeRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "CooperativeCancellation", severity = Severity.Warning, description = "Support cancellation in coroutines", debt = Debt.TEN_MINS)
}
