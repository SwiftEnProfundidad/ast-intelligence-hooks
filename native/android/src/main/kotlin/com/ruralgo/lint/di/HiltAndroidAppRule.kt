package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class HiltAndroidAppRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RequireHiltAndroidApp", severity = Severity.Defect, description = "Application class must have @HiltAndroidApp", debt = Debt.FIVE_MINS)
}
