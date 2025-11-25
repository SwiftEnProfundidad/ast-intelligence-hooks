package com.ruralgo.lint.maps

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class AndroidMapMemoryLeakRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "AndroidMapMemoryLeak",
        severity = Severity.Defect,
        description = "GoogleMap must be cleaned up in onDestroy to prevent memory leaks",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val classText = klass.text
        if (classText.contains("GoogleMap") && classText.contains("onCreate")) {
            val hasOnDestroy = classText.contains("onDestroy")
            val hasMapCleanup = classText.contains("map.clear()") || classText.contains("map = null")
            
            if (!hasOnDestroy || !hasMapCleanup) {
                report(CodeSmell(
                    issue,
                    Entity.from(klass),
                    "GoogleMap without cleanup in onDestroy - call map.clear() and map = null to prevent memory leak"
                ))
            }
        }
    }
}
