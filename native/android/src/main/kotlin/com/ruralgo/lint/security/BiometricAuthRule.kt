package com.ruralgo.lint.security
import io.gitlab.arturbosch.detekt.api.*
class BiometricAuthRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseBiometricPrompt", severity = Severity.CodeSmell, description = "Use BiometricPrompt API for biometric auth", debt = Debt.TEN_MINS)
}
