package com.ruralgo.lint.offline

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class RoomSyncValidationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "RoomSyncValidation",
        severity = Severity.Defect,
        description = "Room @Entity must have sync metadata (syncStatus, lastSyncedAt) for offline-first architecture",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val hasEntityAnnotation = klass.annotationEntries.any { 
            it.shortName?.asString() == "Entity" 
        }
        
        if (!hasEntityAnnotation) return
        
        val properties = klass.getProperties().map { it.name }
        val hasSyncMetadata = properties.any { 
            it == "syncStatus" || it == "lastSyncedAt" || it == "needsSync" 
        }
        
        if (!hasSyncMetadata) {
            report(CodeSmell(
                issue,
                Entity.from(klass),
                "Room @Entity '${klass.name}' missing sync metadata - add 'syncStatus: String' or 'lastSyncedAt: Long' for offline-first sync"
            ))
        }
    }
}
