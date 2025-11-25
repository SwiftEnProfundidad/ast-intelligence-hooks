package com.ruralgo.lint.security

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import java.io.File

class NetworkSecurityConfigRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "NetworkSecurityConfigRule",
        severity = Severity.Security,
        description = "network_security_config.xml required for production (Certificate pinning)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitKtFile(file: KtFile) {
        super.visitKtFile(file)
        
        val filePath = file.virtualFilePath
        if (!filePath.contains("AndroidManifest.xml")) return
        
        val projectRoot = File(filePath).parentFile?.parentFile?.parentFile
        val resDir = File(projectRoot, "src/main/res/xml")
        val networkConfigFile = File(resDir, "network_security_config.xml")
        
        if (!networkConfigFile.exists()) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(file),
                    """
                    🚨 CRITICAL: Missing network_security_config.xml
                    
                    Security: Certificate pinning required for production
                    
                    Create: res/xml/network_security_config.xml
                    
                    ```xml
                    <?xml version="1.0" encoding="utf-8"?>
                    <network-security-config>
                        <domain-config cleartextTrafficPermitted="false">
                            <domain includeSubdomains="true">yourdomain.com</domain>
                            <pin-set expiration="2025-12-31">
                                <pin digest="SHA-256">base64==</pin>
                                <pin digest="SHA-256">backup-base64==</pin>
                            </pin-set>
                        </domain-config>
                    </network-security-config>
                    ```
                    
                    AndroidManifest.xml:
                    ```xml
                    <application
                        android:networkSecurityConfig="@xml/network_security_config">
                    ```
                    
                    This prevents man-in-the-middle attacks.
                    """.trimIndent()
                )
            )
        }
    }
}

