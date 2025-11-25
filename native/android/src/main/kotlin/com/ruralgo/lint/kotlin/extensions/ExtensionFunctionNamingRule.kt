// ═══════════════════════════════════════════════════════════════
// Extension Function Naming Conventions
// ═══════════════════════════════════════════════════════════════

package com.ruralgo.lint.kotlin.extensions

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class ExtensionFunctionNamingRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "ExtensionFunctionNaming",
        severity = Severity.CodeSmell,
        description = "Extension functions should have descriptive names",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        if (function.receiverTypeReference == null) return
        
        val functionName = function.name ?: return
        
        if (functionName.length < 3 || functionName.startsWith("do") || functionName.startsWith("get")) {
            report(CodeSmell(
                issue,
                Entity.from(function),
                """
                Extension function with unclear name: $functionName
                
                Problem: Name doesn't convey intent clearly
                
                ❌ Bad names:
                fun String.do(): String  // What does it do?
                fun List<Int>.get(): Int  // Get what?
                fun Order.x(): Boolean  // Meaningless
                
                ✅ Good names:
                fun String.toTitleCase(): String
                fun List<Int>.secondOrNull(): Int?
                fun Order.isEligibleForDiscount(): Boolean
                
                Naming guidelines:
                
                1. Verbs for actions:
                   fun String.capitalize(): String
                   fun List<T>.shuffled(): List<T>
                   fun Order.cancel(): Order
                
                2. Adjectives for properties:
                   fun String.isBlank(): Boolean
                   fun Order.isPending(): Boolean
                   fun List<T>.isEmpty(): Boolean
                
                3. Conversion functions:
                   fun String.toInt(): Int
                   fun Order.toDto(): OrderDto
                   fun LocalDate.toEpochMillis(): Long
                
                4. Scoped extensions:
                   fun Context.showToast(message: String)
                   fun Fragment.hideKeyboard()
                   fun View.setVisible(visible: Boolean)
                
                5. Collection operations:
                   fun List<Order>.totalAmount(): Double
                   fun List<User>.activeUsers(): List<User>
                   fun List<T>.secondOrNull(): T?
                
                Examples from Kotlin stdlib:
                - String.isBlank()
                - List<T>.firstOrNull()
                - String.toIntOrNull()
                - Iterable<T>.sumOf { }
                - String.padStart(length, char)
                
                Avoid prefixes:
                - get (use property-style names)
                - do (vague)
                - process (vague)
                - handle (vague)
                
                Be specific and intentional!
                """.trimIndent()
            ))
        }
    }
}

