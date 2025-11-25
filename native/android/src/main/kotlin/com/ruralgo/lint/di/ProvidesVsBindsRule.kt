package com.ruralgo.lint.di
import io.gitlab.arturbosch.detekt.api.*
class ProvidesVsBindsRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "PreferBindsOverProvides", severity = Severity.Performance, description = "@Binds is more efficient than @Provides", debt = Debt.TEN_MINS)
}
