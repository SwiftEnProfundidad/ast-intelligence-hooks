package com.ruralgo.lint.coroutines

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.getParentOfType

class FlowLifecycleCollectionRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "FlowLifecycleCollectionRule",
        severity = Severity.Defect,
        description = "Flow.collect must be in lifecycle-aware scope (Memory leak prevention)",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        
        val isFlowCollect = callText.contains(".collect") &&
                           (callText.contains("Flow") || callText.contains("StateFlow") || callText.contains("SharedFlow"))
        
        if (!isFlowCollect) return
        
        val functionBody = expression.getParentOfType<KtNamedFunction>(true)
        val functionText = functionBody?.text ?: ""
        
        val hasLifecycleScope = functionText.contains("lifecycleScope") ||
                               functionText.contains("viewModelScope") ||
                               functionText.contains("lifecycle.repeatOnLifecycle") ||
                               functionText.contains("flowWithLifecycle")
        
        if (!hasLifecycleScope) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(expression),
                    """
                    🚨 CRITICAL: Flow.collect Without Lifecycle Awareness
                    
                    Detected: Flow collection not in lifecycle scope
                    
                    CONSEQUENCES:
                    ❌ Flow keeps collecting after Activity/Fragment destroyed
                    ❌ Memory leak (collector not cancelled)
                    ❌ Updates on destroyed UI → crashes
                    ❌ Battery drain (background collection)
                    ❌ Resource waste
                    
                    CURRENT (WRONG):
                    ```kotlin
                    class MyFragment : Fragment() {
                        override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
                            // ❌ CRITICAL LEAK
                            viewModel.stateFlow.collect { state ->
                                updateUI(state)  // Still collects after destroy!
                            }
                        }
                    }
                    
                    // What happens:
                    // 1. Fragment created → collect starts
                    // 2. User navigates away → Fragment destroyed
                    // 3. collect STILL RUNNING → memory leak
                    // 4. StateFlow emits → updateUI on destroyed view → CRASH
                    ```
                    
                    SOLUTION 1 (lifecycleScope + repeatOnLifecycle):
                    ```kotlin
                    class MyFragment : Fragment() {
                        override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
                            viewLifecycleOwner.lifecycleScope.launch {
                                viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                                    viewModel.stateFlow.collect { state ->
                                        updateUI(state)  // ✅ Auto-cancelled
                                    }
                                }
                            }
                        }
                    }
                    
                    // Automatically:
                    // - Starts collecting when STARTED
                    // - Stops when STOPPED (background)
                    // - Cancels when DESTROYED
                    ```
                    
                    SOLUTION 2 (flowWithLifecycle):
                    ```kotlin
                    class MyFragment : Fragment() {
                        override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
                            viewModel.stateFlow
                                .flowWithLifecycle(
                                    viewLifecycleOwner.lifecycle,
                                    Lifecycle.State.STARTED
                                )
                                .onEach { state ->
                                    updateUI(state)
                                }
                                .launchIn(viewLifecycleOwner.lifecycleScope)
                        }
                    }
                    ```
                    
                    SOLUTION 3 (Compose - collectAsStateWithLifecycle):
                    ```kotlin
                    @Composable
                    fun MyScreen(viewModel: MyViewModel = hiltViewModel()) {
                        val state by viewModel.stateFlow.collectAsStateWithLifecycle()
                        
                        // ✅ Lifecycle-aware collection
                        // Stops when Composable leaves
                        
                        MyContent(state)
                    }
                    ```
                    
                    SOLUTION 4 (Activity):
                    ```kotlin
                    class MyActivity : AppCompatActivity() {
                        override fun onCreate(savedInstanceState: Bundle?) {
                            super.onCreate(savedInstanceState)
                            
                            lifecycleScope.launch {
                                repeatOnLifecycle(Lifecycle.State.STARTED) {
                                    viewModel.stateFlow.collect { state ->
                                        updateUI(state)
                                    }
                                }
                            }
                        }
                    }
                    ```
                    
                    LIFECYCLE STATES:
                    
                    CREATED → STARTED → RESUMED
                       ↓         ↓         ↓
                    DESTROYED ← STOPPED ← PAUSED
                    
                    - CREATED: Fragment exists
                    - STARTED: Visible (not foreground)
                    - RESUMED: Foreground, interactive
                    - PAUSED: Partially visible
                    - STOPPED: Not visible
                    - DESTROYED: Cleaned up
                    
                    WHICH STATE TO USE:
                    
                    STARTED (recommended):
                    - UI updates when visible
                    - Stops when app backgrounded
                    - Battery efficient
                    
                    RESUMED:
                    - Only when in foreground
                    - Pauses when dialog shown
                    - Very conservative
                    
                    CREATED:
                    - Runs even when not visible
                    - Only use for critical background work
                    
                    DEPENDENCIES:
                    ```kotlin
                    // build.gradle.kts
                    dependencies {
                        implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
                        
                        // For Compose
                        implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
                    }
                    ```
                    
                    VIEWMODEL SCOPE:
                    ```kotlin
                    class MyViewModel : ViewModel() {
                        private val _state = MutableStateFlow<State>(State.Loading)
                        val state: StateFlow<State> = _state.asStateFlow()
                        
                        init {
                            viewModelScope.launch {  // ✅ Cancelled when ViewModel cleared
                                repository.getDataStream()
                                    .collect { data ->
                                        _state.value = State.Success(data)
                                    }
                            }
                        }
                    }
                    ```
                    
                    TESTING:
                    ```kotlin
                    @Test
                    fun testFlowCollectionCancelled() = runTest {
                        val fragment = MyFragment()
                        val scenario = launchFragmentInContainer { fragment }
                        
                        // Fragment started
                        scenario.moveToState(Lifecycle.State.STARTED)
                        delay(100)
                        assertTrue(fragment.isCollecting)
                        
                        // Fragment stopped
                        scenario.moveToState(Lifecycle.State.DESTROYED)
                        delay(100)
                        assertFalse(fragment.isCollecting)  // ✅ Cancelled
                    }
                    ```
                    
                    COMMON PATTERNS:
                    
                    Pattern 1 (Multiple Flows):
                    ```kotlin
                    lifecycleScope.launch {
                        repeatOnLifecycle(Lifecycle.State.STARTED) {
                            launch { flow1.collect { handleState1(it) } }
                            launch { flow2.collect { handleState2(it) } }
                            launch { flow3.collect { handleState3(it) } }
                        }
                    }
                    ```
                    
                    Pattern 2 (Combine Flows):
                    ```kotlin
                    lifecycleScope.launch {
                        repeatOnLifecycle(Lifecycle.State.STARTED) {
                            combine(flow1, flow2, flow3) { f1, f2, f3 ->
                                State(f1, f2, f3)
                            }.collect { state ->
                                updateUI(state)
                            }
                        }
                    }
                    ```
                    
                    Pattern 3 (Error Handling):
                    ```kotlin
                    lifecycleScope.launch {
                        repeatOnLifecycle(Lifecycle.State.STARTED) {
                            viewModel.stateFlow
                                .catch { error ->
                                    showError(error)
                                }
                                .collect { state ->
                                    updateUI(state)
                                }
                        }
                    }
                    ```
                    
                    MIGRATION FROM LIVEDATA:
                    ```kotlin
                    // Before (LiveData)
                    viewModel.userData.observe(viewLifecycleOwner) { user ->
                        updateUI(user)
                    }
                    
                    // After (StateFlow)
                    viewLifecycleOwner.lifecycleScope.launch {
                        viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                            viewModel.userStateFlow.collect { user ->
                                updateUI(user)
                            }
                        }
                    }
                    
                    // Or with helper:
                    viewModel.userStateFlow.collectWithLifecycle(
                        viewLifecycleOwner,
                        Lifecycle.State.STARTED
                    ) { user ->
                        updateUI(user)
                    }
                    ```
                    
                    Android Best Practices:
                    "Flow collection must respect lifecycle.
                     Leaks are unacceptable in production apps."
                    
                    This is a CRITICAL memory leak.
                    Fix IMMEDIATELY with lifecycle-aware collection.
                    """.trimIndent()
                )
            )
        }
    }
}

