package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class LaunchedEffectKeysRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "LaunchedEffectCorrectKeys", severity = Severity.Defect, description = "LaunchedEffect must have correct keys", debt = Debt.TEN_MINS)
}
