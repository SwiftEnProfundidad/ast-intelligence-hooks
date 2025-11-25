package com.ruralgo.lint.kotlin.coroutines

import io.gitlab.arturbosch.detekt.api.*

class NoCallbacksUseCoroutinesRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "PreferCoroutinesOverCallbacks",
        severity = Severity.Warning,
        description = "Use suspend functions instead of callbacks",
        debt = Debt.TWENTY_MINS
    )
}
