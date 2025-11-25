package com.ruralgo.lint.room
import io.gitlab.arturbosch.detekt.api.*
class RoomEntityPrimaryKeyRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RoomEntityRequiresPrimaryKey", severity = Severity.Defect, description = "Room @Entity must have @PrimaryKey", debt = Debt.FIVE_MINS)
}
