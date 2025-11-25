package com.ruralgo.lint.security
import io.gitlab.arturbosch.detekt.api.*
class RootDetectionRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "DetectRootedDevices", severity = Severity.Warning, description = "Implement root detection for sensitive apps", debt = Debt.TWENTY_MINS)
}
