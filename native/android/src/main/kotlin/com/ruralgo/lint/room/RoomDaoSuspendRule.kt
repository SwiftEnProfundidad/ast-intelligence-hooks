package com.ruralgo.lint.room
import io.gitlab.arturbosch.detekt.api.*
class RoomDaoSuspendRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RoomDaoUseSuspend", severity = Severity.Warning, description = "Room DAO queries should be suspend functions", debt = Debt.FIVE_MINS)
}
