package com.ruralgo.lint.room

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.getParentOfType

class RoomQueryOptimizationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "RoomQueryOptimizationRule",
        severity = Severity.Performance,
        description = "Room queries without indices on WHERE/JOIN columns (Slow queries)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitAnnotationEntry(annotationEntry: KtAnnotationEntry) {
        super.visitAnnotationEntry(annotationEntry)
        
        if (annotationEntry.shortName?.asString() == "Query") {
            val queryText = annotationEntry.text
            
            val hasWhereClause = queryText.contains("WHERE", ignoreCase = true)
            val hasJoin = queryText.contains("JOIN", ignoreCase = true)
            
            if (hasWhereClause || hasJoin) {
                val parentClass = annotationEntry.getParentOfType<KtClass>(true)
                val classText = parentClass?.text ?: ""
                
                val hasIndex = classText.contains("@Index") ||
                              classText.contains("indices = ")
                
                if (!hasIndex) {
                    report(
                        CodeSmell(
                            issue,
                            Entity.from(annotationEntry),
                            """
                            🚨 HIGH: Room Query Without Index
                            
                            Query has WHERE/JOIN but no @Index.
                            Slow queries on large tables.
                            
                            ADD INDEX:
                            ```kotlin
                            @Entity(
                                tableName = "users",
                                indices = [Index(value = ["email"], unique = true)]
                            )
                            data class UserEntity(
                                @PrimaryKey val id: String,
                                val email: String
                            )
                            ```
                            
                            Performance: 1000ms → 10ms on 10K rows
                            """.trimIndent()
                        )
                    )
                }
            }
        }
    }
}

