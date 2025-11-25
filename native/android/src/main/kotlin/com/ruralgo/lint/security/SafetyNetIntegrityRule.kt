package com.ruralgo.lint.security
import io.gitlab.arturbosch.detekt.api.*
class SafetyNetIntegrityRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseSafetyNetIntegrity", severity = Severity.Warning, description = "Use Play Integrity API for device verification", debt = Debt.TWENTY_MINS)
}
