package com.ruralgo.lint.multimodule
import io.gitlab.arturbosch.detekt.api.*
class DependencyDirectionRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "DependencyDirectionRule", severity = Severity.CodeSmell, description = "Multi-module architecture", debt = Debt.TWENTY_MINS)
}
