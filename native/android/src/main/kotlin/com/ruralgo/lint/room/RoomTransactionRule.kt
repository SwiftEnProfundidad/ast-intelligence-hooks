package com.ruralgo.lint.room
import io.gitlab.arturbosch.detekt.api.*
class RoomTransactionRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseRoomTransaction", severity = Severity.Warning, description = "Use @Transaction for multi-query operations", debt = Debt.TEN_MINS)
}
