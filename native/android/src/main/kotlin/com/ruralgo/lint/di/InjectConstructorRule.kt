package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class InjectConstructorRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "PreferConstructorInjection", severity = Severity.CodeSmell, description = "Prefer constructor injection over field injection", debt = Debt.TEN_MINS)
}
