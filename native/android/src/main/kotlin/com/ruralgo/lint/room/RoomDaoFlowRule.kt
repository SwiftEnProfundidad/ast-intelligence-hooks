package com.ruralgo.lint.room
import io.gitlab.arturbosch.detekt.api.*
class RoomDaoFlowRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "RoomDaoUseFlow", severity = Severity.CodeSmell, description = "Use Flow<T> for observable Room queries", debt = Debt.TEN_MINS)
}
