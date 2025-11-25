package com.ruralgo.lint.coroutines
import io.gitlab.arturbosch.detekt.api.*
class CollectAsStateInComposeRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseCollectAsState", severity = Severity.Warning, description = "Use collectAsState in Compose", debt = Debt.FIVE_MINS)
}
