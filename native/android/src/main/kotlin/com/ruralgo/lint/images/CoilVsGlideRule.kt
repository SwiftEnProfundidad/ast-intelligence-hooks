package com.ruralgo.lint.images
import io.gitlab.arturbosch.detekt.api.*
class CoilVsGlideRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "CoilVsGlideRule", severity = Severity.CodeSmell, description = "Image loading best practices", debt = Debt.TEN_MINS)
}
