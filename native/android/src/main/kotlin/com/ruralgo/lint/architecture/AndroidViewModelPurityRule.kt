package com.ruralgo.lint.architecture

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*

class AndroidViewModelPurityRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "AndroidViewModelPurityRule",
        severity = Severity.Maintainability,
        description = "ViewModels must not import Android UI (Testability)",
        debt = Debt.TEN_MINS
    )
    
    override fun visitImportDirective(importDirective: KtImportDirective) {
        super.visitImportDirective(importDirective)
        
        val filePath = importDirective.containingKtFile.virtualFilePath
        val isViewModel = filePath.contains("ViewModel.kt") ||
                         filePath.contains("/viewmodels/") ||
                         filePath.contains("/presentation/")
        
        if (!isViewModel) return
        
        val importPath = importDirective.importedFqName?.asString() ?: return
        
        val forbiddenImports = listOf(
            "android.widget" to "UI widgets",
            "android.view.View" to "View class",
            "androidx.compose.ui" to "Compose UI",
            "androidx.fragment" to "Fragment",
            "android.app.Activity" to "Activity",
            "android.content.Context" to "Context (use @ApplicationContext)"
        )
        
        forbiddenImports.forEach { (prefix, reason) ->
            if (importPath.startsWith(prefix)) {
                report(
                    CodeSmell(
                        issue,
                        Entity.from(importDirective),
                        """
                        🚨 CRITICAL: ViewModel Purity Violation
                        
                        Import: $importPath
                        Reason: $reason in ViewModel
                        
                        MVVM: ViewModels must be UI-agnostic
                        
                        Bad:
                        ```kotlin
                        import android.widget.Toast  // ❌
                        
                        class MyViewModel : ViewModel() {
                            fun showMessage(context: Context) {
                                Toast.makeText(context, "Hi", Toast.LENGTH_SHORT).show()
                            }
                        }
                        ```
                        
                        Good:
                        ```kotlin
                        class MyViewModel : ViewModel() {
                            private val _message = MutableStateFlow<String?>(null)
                            val message: StateFlow<String?> = _message
                            
                            fun showMessage() {
                                _message.value = "Hi"  // ✅ State only
                            }
                        }
                        
                        // In Composable:
                        val message by viewModel.message.collectAsState()
                        message?.let { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
                        ```
                        
                        Testability:
                        ```kotlin
                        @Test
                        fun testShowMessage() {
                            val vm = MyViewModel()
                            vm.showMessage()
                            assertEquals("Hi", vm.message.value)  // ✅ No Android needed
                        }
                        ```
                        
                        Use @ApplicationContext if Context needed.
                        """.trimIndent()
                    )
                )
            }
        }
    }
}

