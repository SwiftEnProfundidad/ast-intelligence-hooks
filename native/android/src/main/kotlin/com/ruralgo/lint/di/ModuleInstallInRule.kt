package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class ModuleInstallInRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RequireModuleInstallIn", severity = Severity.Defect, description = "@Module must have @InstallIn", debt = Debt.FIVE_MINS)
}
