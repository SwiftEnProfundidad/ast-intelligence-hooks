// ═══════════════════════════════════════════════════════════════
// LSP: Liskov Substitution Principle - Contract Validator
// ═══════════════════════════════════════════════════════════════
// Detects override methods that weaken parent contract

package com.ruralgo.lint.solid

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.lexer.KtTokens

class LSPContractRule(config: Config = Config.empty) : Rule(config) {
    
    override val issue = Issue(
        id = "LSPContractWeakening",
        severity = Severity.Defect,
        description = "Override weakens parent contract - violates LSP (subtypes must be substitutable)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        // Check if method is override
        val isOverride = function.hasModifier(KtTokens.OVERRIDE_KEYWORD)
        if (!isOverride) return
        
        val name = function.name ?: return
        
        // Check for LSP violations
        
        // 1. Override adds exceptions (throws)
        val throwsExceptions = function.bodyExpression?.let { body ->
            containsThrowStatement(body)
        } ?: false
        
        if (throwsExceptions) {
            report(CodeSmell(
                issue,
                Entity.from(function),
                """
                Override '$name' throws exceptions - verify parent signature allows throws.
                
                LSP Violation: Subtype cannot throw exceptions not in parent signature.
                
                Ensure parent function signature includes exceptions:
                open fun $name() {
                    throw SomeException()  // ← Parent must declare exceptions
                }
                """.trimIndent()
            ))
        }
        
        // 2. Override adds preconditions (require, check)
        val addsPreconditions = function.bodyExpression?.let { body ->
            containsPrecondition(body)
        } ?: false
        
        if (addsPreconditions) {
            report(CodeSmell(
                issue.copy(severity = Severity.Defect),
                Entity.from(function),
                """
                Override '$name' adds preconditions - violates LSP.
                
                LSP Rule: Preconditions cannot be strengthened in subtypes.
                
                Problem:
                - Parent accepts wider range of inputs
                - Child narrows inputs with require/check
                - Substitutability broken
                
                Solution:
                - Move precondition to parent
                - OR create new method (don't override)
                """.trimIndent()
            ))
        }
    }
    
    private fun containsThrowStatement(body: KtExpression): Boolean {
        var hasThrow = false
        
        body.accept(object : KtTreeVisitorVoid() {
            override fun visitThrowExpression(expression: KtThrowExpression) {
                hasThrow = true
                super.visitThrowExpression(expression)
            }
        })
        
        return hasThrow
    }
    
    private fun containsPrecondition(body: KtExpression): Boolean {
        var hasPrecondition = false
        
        body.accept(object : KtTreeVisitorVoid() {
            override fun visitCallExpression(expression: KtCallExpression) {
                val callee = expression.calleeExpression?.text
                if (callee in listOf("require", "check", "assert", "precondition")) {
                    hasPrecondition = true
                }
                super.visitCallExpression(expression)
            }
        })
        
        return hasPrecondition
    }
}

