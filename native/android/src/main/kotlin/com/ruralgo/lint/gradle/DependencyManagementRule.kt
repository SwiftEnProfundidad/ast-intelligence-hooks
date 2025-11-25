package com.ruralgo.lint.gradle
import io.gitlab.arturbosch.detekt.api.*
class DependencyManagementRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "DependencyManagementRule", severity = Severity.CodeSmell, description = "Gradle best practices", debt = Debt.TEN_MINS)
}
