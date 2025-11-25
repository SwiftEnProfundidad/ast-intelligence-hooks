package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class DisposableEffectCleanupRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "DisposableEffectCleanup", severity = Severity.Defect, description = "DisposableEffect must have onDispose cleanup", debt = Debt.TEN_MINS)
}
