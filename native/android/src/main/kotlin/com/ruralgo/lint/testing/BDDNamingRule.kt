package com.ruralgo.lint.testing

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class BDDNamingRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "BDDNamingRule",
        severity = Severity.Style,
        description = "Test functions must follow Given-When-Then naming (BDD pattern)",
        debt = Debt.FIVE_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val functionName = function.name ?: return
        val isTest = function.annotationEntries.any {
            it.shortName?.asString() == "Test"
        }
        
        if (!isTest) return
        
        val hasGivenWhenThen = functionName.contains("given", ignoreCase = true) &&
                              (functionName.contains("when", ignoreCase = true) || functionName.contains("should", ignoreCase = true)) &&
                              functionName.contains("then", ignoreCase = true)
        
        val hasDescriptiveName = functionName.contains("_") && functionName.split("_").size >= 3
        
        if (!hasGivenWhenThen && !hasDescriptiveName && functionName.length < 15) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(function),
                    """
                    🚨 HIGH: Test Name Not BDD Format
                    
                    Test: $functionName
                    
                    BDD (Behavior-Driven Development) Naming:
                    
                    FORMAT:
                    given_[precondition]_when_[action]_then_[expected]
                    
                    CURRENT (UNCLEAR):
                    ```kotlin
                    @Test
                    fun test1() { }  // ❌ What does it test?
                    
                    @Test
                    fun testUser() { }  // ❌ What about user?
                    ```
                    
                    CORRECT (BDD):
                    ```kotlin
                    @Test
                    fun given_validEmail_when_userRegisters_then_accountCreated() {
                        // Arrange (Given)
                        val email = "test@test.com"
                        
                        // Act (When)
                        val result = registerUser(email)
                        
                        // Assert (Then)
                        assertTrue(result.isSuccess)
                    }
                    
                    @Test
                    fun given_invalidEmail_when_userRegisters_then_errorThrown() {
                        val email = "invalid"
                        
                        assertThrows<ValidationException> {
                            registerUser(email)
                        }
                    }
                    ```
                    
                    ALTERNATIVE (Backtick):
                    ```kotlin
                    @Test
                    fun `given valid email, when user registers, then account created`() {
                        // Test
                    }
                    ```
                    
                    BENEFITS:
                    - Test purpose clear from name
                    - Documentation in code
                    - Easy to find specific test
                    - Non-technical stakeholders can read
                    
                    This is a HIGH code quality issue.
                    Use BDD naming for clarity.
                    """.trimIndent()
                )
            )
        }
    }
}

