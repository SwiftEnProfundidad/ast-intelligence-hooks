package com.ruralgo.lint.multimodule
import io.gitlab.arturbosch.detekt.api.*
class DynamicFeatureRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "DynamicFeatureRule", severity = Severity.CodeSmell, description = "Multi-module architecture", debt = Debt.TWENTY_MINS)
}
