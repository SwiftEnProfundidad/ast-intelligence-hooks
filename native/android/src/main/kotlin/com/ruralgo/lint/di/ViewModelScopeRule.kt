package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class ViewModelScopeRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseViewModelScoped", severity = Severity.CodeSmell, description = "Use @ViewModelScoped for ViewModel dependencies", debt = Debt.FIVE_MINS)
}
