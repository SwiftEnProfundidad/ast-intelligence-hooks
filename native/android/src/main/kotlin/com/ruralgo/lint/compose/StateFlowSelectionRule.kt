package com.ruralgo.lint.compose

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class StateFlowSelectionRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "StateFlowSelectionRule",
        severity = Severity.CodeSmell,
        description = "Use StateFlow for state, SharedFlow for events (Correct Flow type selection)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitProperty(property: KtProperty) {
        super.visitProperty(property)
        
        val propertyName = property.name ?: return
        val propertyType = property.typeReference?.text ?: return
        
        val isState = propertyName.contains("state", ignoreCase = true) ||
                     propertyName.contains("data", ignoreCase = true) ||
                     propertyName.contains("value", ignoreCase = true)
        
        val isEvent = propertyName.contains("event", ignoreCase = true) ||
                     propertyName.contains("action", ignoreCase = true) ||
                     propertyName.contains("effect", ignoreCase = true)
        
        if (isState && propertyType.contains("SharedFlow")) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(property),
                    """
                    🚨 HIGH: Wrong Flow Type for State
                    
                    Property: $propertyName
                    Type: SharedFlow
                    Should be: StateFlow
                    
                    StateFlow vs SharedFlow:
                    
                    StateFlow:
                    ✅ Always has value
                    ✅ For state (UI state, data)
                    ✅ Conflated (latest value only)
                    ✅ New collectors get current value
                    
                    SharedFlow:
                    ✅ May have no value
                    ✅ For events (one-time actions)
                    ✅ Can be configured (replay, buffer)
                    ✅ New collectors get nothing by default
                    
                    CURRENT (WRONG):
                    ```kotlin
                    class MyViewModel : ViewModel() {
                        private val _uiState = MutableSharedFlow<UiState>()  // ❌
                        val uiState: SharedFlow<UiState> = _uiState
                    }
                    
                    // Problem:
                    // - New collectors don't get current state
                    // - Screen rotation loses state
                    // - Race conditions
                    ```
                    
                    CORRECT:
                    ```kotlin
                    class MyViewModel : ViewModel() {
                        private val _uiState = MutableStateFlow(UiState.Loading)  // ✅
                        val uiState: StateFlow<UiState> = _uiState.asStateFlow()
                    }
                    
                    // Benefits:
                    // - Always has value
                    // - Configuration survives
                    // - No race conditions
                    ```
                    
                    Use StateFlow for state.
                    """.trimIndent()
                )
            )
        }
        
        if (isEvent && propertyType.contains("StateFlow")) {
            report(
                CodeSmell(
                    issue,
                    Entity.from(property),
                    """
                    🚨 HIGH: Wrong Flow Type for Events
                    
                    Property: $propertyName
                    Type: StateFlow
                    Should be: SharedFlow
                    
                    Events (one-time actions):
                    - Show toast
                    - Navigate
                    - Show dialog
                    - Trigger animation
                    
                    Use SharedFlow for events to avoid:
                    - Re-triggering on configuration change
                    - Multiple executions
                    - Stale events
                    
                    CORRECT:
                    ```kotlin
                    private val _events = MutableSharedFlow<Event>()
                    val events: SharedFlow<Event> = _events.asSharedFlow()
                    
                    fun showToast() {
                        viewModelScope.launch {
                            _events.emit(Event.ShowToast("Message"))
                        }
                    }
                    ```
                    
                    Use SharedFlow for one-time events.
                    """.trimIndent()
                )
            )
        }
    }
}

