package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class SingletonScopeRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RestrictSingletonScope", severity = Severity.Warning, description = "@Singleton only for global resources", debt = Debt.TEN_MINS)
}
