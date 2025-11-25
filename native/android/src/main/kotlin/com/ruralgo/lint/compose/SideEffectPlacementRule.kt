package com.ruralgo.lint.compose

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class SideEffectPlacementRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "SideEffectPlacementRule",
        severity = Severity.Defect,
        description = "Side effects must be in LaunchedEffect/DisposableEffect (Compose correctness)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitNamedFunction(function: KtNamedFunction) {
        super.visitNamedFunction(function)
        
        val isComposable = function.annotationEntries.any {
            it.shortName?.asString() == "Composable"
        }
        
        if (!isComposable) return
        
        val functionBody = function.bodyExpression?.text ?: return
        
        val hasSideEffect = functionBody.contains("viewModel.") && 
                           (functionBody.contains(".collect") ||
                            functionBody.contains(".observeAsState") ||
                            functionBody.contains("CoroutineScope") ||
                            functionBody.contains("launch {"))
        
        val hasProperEffect = functionBody.contains("LaunchedEffect") ||
                             functionBody.contains("DisposableEffect") ||
                             functionBody.contains("SideEffect")
        
        if (hasSideEffect && !hasProperEffect) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(function),
                    """
                    🚨 CRITICAL: Side Effect Outside Effect Scope
                    
                    Composable: ${function.name}
                    Problem: Side effect not in LaunchedEffect
                    
                    Jetpack Compose Rules:
                    
                    COMPOSABLE FUNCTIONS MUST BE:
                    ✅ Idempotent (same input → same output)
                    ✅ Fast (<16ms)
                    ✅ Side-effect free (in body)
                    ✅ Can be called multiple times
                    ✅ Can be called in any order
                    ✅ Recomposition-safe
                    
                    SIDE EFFECTS = BREAKING THESE RULES
                    
                    CURRENT (WRONG):
                    ```kotlin
                    @Composable
                    fun UserScreen(viewModel: UserViewModel) {
                        // ❌ CRITICAL: Side effect in composition!
                        viewModel.loadUser()  // Called every recomposition!
                        
                        Text(viewModel.userName)
                    }
                    
                    // What happens:
                    // 1. Composable called first time → loadUser()
                    // 2. State changes → Recomposition
                    // 3. Composable called AGAIN → loadUser() AGAIN
                    // 4. Infinite loop or redundant network calls
                    ```
                    
                    SOLUTION (LaunchedEffect):
                    ```kotlin
                    @Composable
                    fun UserScreen(viewModel: UserViewModel) {
                        LaunchedEffect(Unit) {  // ✅ Runs only once
                            viewModel.loadUser()
                        }
                        
                        Text(viewModel.userName)
                    }
                    
                    // LaunchedEffect guarantees:
                    // - Runs once per key (Unit)
                    // - Cancelled on Composable exits
                    // - Respects lifecycle
                    ```
                    
                    EFFECT TYPES:
                    
                    1. LaunchedEffect (Async operations):
                    ```kotlin
                    LaunchedEffect(userId) {  // Re-runs if userId changes
                        val user = viewModel.fetchUser(userId)
                        // Update state
                    }
                    ```
                    
                    2. DisposableEffect (Cleanup required):
                    ```kotlin
                    DisposableEffect(Unit) {
                        val listener = database.addListener { data ->
                            viewModel.update(data)
                        }
                        
                        onDispose {
                            listener.remove()  // ✅ Cleanup
                        }
                    }
                    ```
                    
                    3. SideEffect (Sync with external state):
                    ```kotlin
                    SideEffect {
                        analyticsTracker.setScreen(currentScreen)
                    }
                    ```
                    
                    4. rememberCoroutineScope (Manual control):
                    ```kotlin
                    val scope = rememberCoroutineScope()
                    
                    Button(onClick = {
                        scope.launch {  // ✅ Controlled launch
                            viewModel.save()
                        }
                    }) {
                        Text("Save")
                    }
                    ```
                    
                    COMMON MISTAKES:
                    
                    Mistake 1 (Flow collect):
                    ```kotlin
                    // ❌ WRONG
                    @Composable
                    fun MyScreen(viewModel: VM) {
                        viewModel.stateFlow.collect { state ->
                            // Runs every recomposition!
                        }
                    }
                    
                    // ✅ RIGHT
                    @Composable
                    fun MyScreen(viewModel: VM) {
                        val state by viewModel.stateFlow.collectAsState()
                        // Collects ONCE, updates when flow emits
                    }
                    ```
                    
                    Mistake 2 (Launch in body):
                    ```kotlin
                    // ❌ WRONG
                    @Composable
                    fun MyScreen() {
                        CoroutineScope(Dispatchers.IO).launch {
                            // New coroutine EVERY recomposition!
                        }
                    }
                    
                    // ✅ RIGHT
                    @Composable
                    fun MyScreen() {
                        LaunchedEffect(Unit) {
                            // Launched ONCE
                            withContext(Dispatchers.IO) {
                                // Background work
                            }
                        }
                    }
                    ```
                    
                    Mistake 3 (Key mistakes):
                    ```kotlin
                    // ❌ WRONG - Always new object
                    LaunchedEffect(MyData()) {
                        // Runs EVERY recomposition
                    }
                    
                    // ✅ RIGHT - Stable key
                    LaunchedEffect(userId) {
                        // Runs only when userId changes
                    }
                    
                    // ✅ BETTER - Multiple keys
                    LaunchedEffect(userId, filter) {
                        // Runs when either changes
                    }
                    ```
                    
                    KEYS BEST PRACTICES:
                    - Unit: Run once
                    - true: Run every recomposition (rare use case)
                    - Stable value (Int, String, Enum): Run when changes
                    - Data class: Must be @Stable or @Immutable
                    
                    LIFECYCLE:
                    ```kotlin
                    @Composable
                    fun MyScreen() {
                        LaunchedEffect(Unit) {
                            println("Composable entered")
                            
                            try {
                                // Long running work
                                while (true) {
                                    delay(1000)
                                    update()
                                }
                            } finally {
                                println("Composable exited")
                                // Cleanup if needed
                            }
                        }
                    }
                    
                    // Automatically cancelled when Composable leaves composition
                    ```
                    
                    VIEWMODEL INTEGRATION:
                    ```kotlin
                    @Composable
                    fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
                        val uiState by viewModel.uiState.collectAsState()
                        
                        LaunchedEffect(uiState.userId) {
                            if (uiState.userId != null) {
                                viewModel.loadUserDetails(uiState.userId)
                            }
                        }
                        
                        UserContent(uiState)
                    }
                    ```
                    
                    TESTING:
                    ```kotlin
                    @Test
                    fun testSideEffectNotCalled() = runComposeUiTest {
                        var callCount = 0
                        
                        setContent {
                            MyComposable {
                                callCount++  // ❌ Called many times!
                            }
                        }
                        
                        // Trigger recomposition
                        waitForIdle()
                        
                        assertTrue(callCount > 1, "Side effect called ${'$'}callCount times")
                    }
                    
                    @Test
                    fun testLaunchedEffectCalledOnce() = runComposeUiTest {
                        var callCount = 0
                        
                        setContent {
                            LaunchedEffect(Unit) {
                                callCount++  // ✅ Called once
                            }
                        }
                        
                        waitForIdle()
                        assertEquals(1, callCount)
                    }
                    ```
                    
                    PERFORMANCE IMPACT:
                    - Side effect in body: O(n) where n = recompositions
                    - LaunchedEffect: O(1) per key change
                    
                    Compose Philosophy:
                    "Composables are called frequently and in any order.
                     Side effects break this guarantee."
                    
                    This is a CRITICAL Compose correctness issue.
                    Fix IMMEDIATELY for stable UI.
                    """.trimIndent()
                )
            )
        }
    }
}

