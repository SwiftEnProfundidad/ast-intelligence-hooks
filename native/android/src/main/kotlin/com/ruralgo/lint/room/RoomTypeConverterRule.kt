package com.ruralgo.lint.room
import io.gitlab.arturbosch.detekt.api.*
class RoomTypeConverterRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(id = "UseRoomTypeConverter", severity = Severity.CodeSmell, description = "Use @TypeConverter for custom types in Room", debt = Debt.TEN_MINS)
}
