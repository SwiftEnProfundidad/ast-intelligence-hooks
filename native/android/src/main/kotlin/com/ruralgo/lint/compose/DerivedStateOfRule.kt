package com.ruralgo.lint.compose

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class DerivedStateOfRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "DerivedStateOfRule",
        severity = Severity.Performance,
        description = "Expensive calculations in Composables must use derivedStateOf",
        debt = Debt.TEN_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val isComposable = function.annotationEntries.any {
            it.shortName?.asString() == "Composable"
        }
        
        if (!isComposable) return
        
        val functionBody = function.bodyExpression?.text ?: return
        
        val hasExpensiveCalculation = functionBody.contains(".filter") ||
                                     functionBody.contains(".map") ||
                                     functionBody.contains(".sortedBy") ||
                                     functionBody.contains(".groupBy")
        
        val hasDerivedStateOf = functionBody.contains("derivedStateOf")
        val hasRemember = functionBody.contains("remember {")
        
        if (hasExpensiveCalculation && !hasDerivedStateOf && hasRemember) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(function),
                    """
                    🚨 HIGH: Expensive Calculation Without derivedStateOf
                    
                    Composable: ${function.name}
                    
                    Jetpack Compose Performance:
                    
                    PROBLEM:
                    Calculations run on EVERY recomposition
                    
                    CURRENT (SLOW):
                    ```kotlin
                    @Composable
                    fun ItemList(items: List<Item>) {
                        val filtered = remember {
                            items.filter { it.isActive }  // ❌ Runs every time items changes
                        }
                        
                        LazyColumn {
                            items(filtered) { item ->
                                ItemCard(item)
                            }
                        }
                    }
                    
                    // Recomposition triggers:
                    // - Any state change
                    // - Parent recompose
                    // - Configuration change
                    // → filter runs EVERY time
                    ```
                    
                    SOLUTION (derivedStateOf):
                    ```kotlin
                    @Composable
                    fun ItemList(items: List<Item>) {
                        val filtered by remember(items) {
                            derivedStateOf {
                                items.filter { it.isActive }  // ✅ Only when items change
                            }
                        }
                        
                        LazyColumn {
                            items(filtered) { item ->
                                ItemCard(item)
                            }
                        }
                    }
                    
                    // Calculation runs ONLY when:
                    // - items list changes
                    // NOT on every recomposition
                    ```
                    
                    WHEN TO USE:
                    
                    derivedStateOf for:
                    - filter, map, sort operations
                    - Calculations from state
                    - Expensive transformations
                    
                    remember for:
                    - Simple objects
                    - Non-state-derived values
                    
                    EXAMPLES:
                    
                    Filter + Sort:
                    ```kotlin
                    val sortedFiltered by remember(items, sortOrder, filterQuery) {
                        derivedStateOf {
                            items
                                .filter { it.name.contains(filterQuery) }
                                .sortedBy { 
                                    when (sortOrder) {
                                        SortOrder.NAME -> it.name
                                        SortOrder.DATE -> it.date
                                    }
                                }
                        }
                    }
                    ```
                    
                    GroupBy:
                    ```kotlin
                    val groupedItems by remember(items) {
                        derivedStateOf {
                            items.groupBy { it.category }
                        }
                    }
                    ```
                    
                    Custom Calculation:
                    ```kotlin
                    val total by remember(cart) {
                        derivedStateOf {
                            cart.items.sumOf { it.price * it.quantity }
                        }
                    }
                    ```
                    
                    PERFORMANCE IMPACT:
                    
                    Without derivedStateOf:
                    - 1000 items filtered on EVERY recomposition
                    - 60 FPS = filter 60 times/second
                    - UI lag, dropped frames
                    
                    With derivedStateOf:
                    - Filter only when items change
                    - Smooth 60 FPS
                    
                    TESTING:
                    ```kotlin
                    @Test
                    fun testDerivedStateEfficiency() = runComposeUiTest {
                        var filterCount = 0
                        
                        setContent {
                            val items = listOf(...)
                            val filtered by remember(items) {
                                derivedStateOf {
                                    filterCount++
                                    items.filter { it.isActive }
                                }
                            }
                        }
                        
                        waitForIdle()
                        
                        // Should calculate once, not on every recomposition
                        assertEquals(1, filterCount)
                    }
                    ```
                    
                    This is a HIGH performance issue.
                    Use derivedStateOf for expensive calculations.
                    """.trimIndent()
                )
            )
        }
    }
}

