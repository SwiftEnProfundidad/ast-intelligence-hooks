package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class ComposableFunctionNamingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ComposablePascalCase", severity = Severity.CodeSmell, description = "@Composable functions must use PascalCase", debt = Debt.FIVE_MINS)
}
