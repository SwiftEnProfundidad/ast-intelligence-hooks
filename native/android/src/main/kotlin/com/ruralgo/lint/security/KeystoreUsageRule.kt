package com.ruralgo.lint.security
import io.gitlab.arturbosch.detekt.api.*
class KeystoreUsageRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseAndroidKeystore", severity = Severity.Defect, description = "Use Android Keystore for cryptographic keys", debt = Debt.TWENTY_MINS)
}
