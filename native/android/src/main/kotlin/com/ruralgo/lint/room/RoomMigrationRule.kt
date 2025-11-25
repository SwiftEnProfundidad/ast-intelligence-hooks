package com.ruralgo.lint.room
import io.gitlab.arturbosch.detekt.api.*
class RoomMigrationRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "ProvideRoomMigrations", severity = Severity.Defect, description = "Provide versioned migrations for Room", debt = Debt.TWENTY_MINS)
}
