package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class AndroidEntryPointRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RequireAndroidEntryPoint", severity = Severity.Warning, description = "Use @AndroidEntryPoint on Activity/Fragment/ViewModel", debt = Debt.FIVE_MINS)
}
