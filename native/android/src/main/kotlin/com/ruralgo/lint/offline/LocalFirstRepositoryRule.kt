package com.ruralgo.lint.offline

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class LocalFirstRepositoryRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "LocalFirstRepository",
        severity = Severity.Defect,
        description = "Repository pattern must implement local-first: query local DB, sync with remote in background",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val className = klass.name ?: return
        if (!className.contains("Repository")) return
        
        val classText = klass.text
        val hasLocalSource = classText.contains("dao") || 
                           classText.contains("database") || 
                           classText.contains("Room")
        val hasRemoteSource = classText.contains("api") || 
                            classText.contains("service") || 
                            classText.contains("retrofit")
        
        if (hasRemoteSource && !hasLocalSource) {
            report(CodeSmell(
                issue,
                Entity.from(klass),
                "Repository '${className}' with remote only - implement local-first: query local database, sync with remote in background for offline resilience"
            ))
        }
    }
}
