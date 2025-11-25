package com.ruralgo.lint.room
import io.gitlab.arturbosch.detekt.api.*
class RoomDestructiveMigrationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "AvoidDestructiveMigration", severity = Severity.Defect, description = "Avoid fallbackToDestructiveMigration in production", debt = Debt.TEN_MINS)
}
