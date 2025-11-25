package com.ruralgo.lint.database

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class RoomNPlusOneQueryRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "RoomNPlusOneQueryRule",
        severity = Severity.Performance,
        description = "Room queries in loops cause N+1 problem (Performance killer)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitForExpression(expression: KtForExpression) {
        super.visitForExpression(expression)
        
        val loopBody = expression.body?.text ?: return
        
        val hasRoomQuery = loopBody.contains("dao.") ||
                          loopBody.contains("database.") ||
                          loopBody.contains("@Query") ||
                          loopBody.contains("suspend fun get") ||
                          loopBody.contains("suspend fun find")
        
        if (hasRoomQuery) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    🚨 CRITICAL: N+1 Query Problem in Room
                    
                    Detected: Database query inside loop
                    
                    PERFORMANCE IMPACT:
                    ❌ 1 query → N queries
                    ❌ 100 items = 100 queries = 5+ seconds
                    ❌ UI freeze
                    ❌ Battery drain
                    ❌ Network waste (if remote DB)
                    
                    CURRENT (SLOW):
                    ```kotlin
                    // ❌ N+1 queries (1 + N)
                    val orders = orderDao.getAllOrders()  // 1 query
                    
                    for (order in orders) {
                        val user = userDao.getUserById(order.userId)  // N queries!
                        order.userName = user.name
                    }
                    
                    // 100 orders = 101 queries = 5 seconds
                    ```
                    
                    SOLUTION 1 (JOIN):
                    ```kotlin
                    @Dao
                    interface OrderDao {
                        @Query(\"\"\"
                            SELECT orders.*, users.name as userName
                            FROM orders
                            INNER JOIN users ON orders.userId = users.id
                        \"\"\")
                        suspend fun getOrdersWithUsers(): List<OrderWithUser>
                    }
                    
                    data class OrderWithUser(
                        @Embedded val order: Order,
                        val userName: String
                    )
                    
                    // ✅ 1 query total
                    val ordersWithUsers = orderDao.getOrdersWithUsers()
                    ```
                    
                    SOLUTION 2 (@Relation):
                    ```kotlin
                    data class OrderWithUser(
                        @Embedded val order: Order,
                        @Relation(
                            parentColumn = "userId",
                            entityColumn = "id"
                        )
                        val user: User
                    )
                    
                    @Query("SELECT * FROM orders")
                    suspend fun getOrdersWithUsers(): List<OrderWithUser>
                    
                    // ✅ Room generates efficient JOIN
                    ```
                    
                    SOLUTION 3 (IN clause):
                    ```kotlin
                    val orders = orderDao.getAllOrders()
                    val userIds = orders.map { it.userId }.distinct()
                    
                    val users = userDao.getUsersByIds(userIds)  // ✅ 1 query for all
                    val userMap = users.associateBy { it.id }
                    
                    val enriched = orders.map { order ->
                        order.copy(userName = userMap[order.userId]?.name)
                    }
                    
                    // 2 queries total vs N+1
                    ```
                    
                    BENCHMARKS:
                    - N+1 (100 items): ~5000ms
                    - JOIN: ~50ms
                    - IN clause: ~100ms
                    
                    DETECTION:
                    ```kotlin
                    // Enable in debug build
                    if (BuildConfig.DEBUG) {
                        StrictMode.setThreadPolicy(
                            StrictMode.ThreadPolicy.Builder()
                                .detectDiskReads()
                                .detectDiskWrites()
                                .penaltyLog()
                                .build()
                        )
                    }
                    ```
                    
                    This is a CRITICAL performance issue.
                    Fix with JOIN or batch queries.
                    """.trimIndent()
                )
            )
        }
    }
}

