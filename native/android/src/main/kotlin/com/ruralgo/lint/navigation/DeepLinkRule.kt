package com.ruralgo.lint.navigation
import io.gitlab.arturbosch.detekt.api.*
class DeepLinkRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "DeepLinkRule", severity = Severity.CodeSmell, description = "Navigation best practices", debt = Debt.TEN_MINS)
}
