package com.ruralgo.lint.images
import io.gitlab.arturbosch.detekt.api.*
class ImageTransformationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ImageTransformationRule", severity = Severity.CodeSmell, description = "Image loading best practices", debt = Debt.TEN_MINS)
}
