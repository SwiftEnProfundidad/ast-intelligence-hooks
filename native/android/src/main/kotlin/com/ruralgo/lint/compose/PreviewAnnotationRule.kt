package com.ruralgo.lint.compose
import io.gitlab.arturbosch.detekt.api.*
class PreviewAnnotationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ComposePreview", severity = Severity.CodeSmell, description = "Add @Preview for Composable visualization", debt = Debt.FIVE_MINS)
}
