package com.ruralgo.lint.offline

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.getParentOfType

class ConnectivityCheckRule(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "ConnectivityCheck",
        severity = Severity.Defect,
        description = "API calls must check network connectivity first for offline resilience",
        debt = Debt.TEN_MINS
    )
    
    override fun visitCallExpression(expression: KtCallExpression) {
        super.visitCallExpression(expression)
        
        val callText = expression.text
        val isApiCall = callText.contains("retrofit") || 
                       callText.contains("api.") || 
                       callText.contains("apiService") ||
                       callText.contains("suspend fun") && callText.contains("Response")
        
        if (!isApiCall) return
        
        val containingFunction = expression.getParentOfType<KtNamedFunction>(true)
        val functionText = containingFunction?.text ?: ""
        
        val hasConnectivityCheck = functionText.contains("isNetworkAvailable") ||
                                  functionText.contains("ConnectivityManager") ||
                                  functionText.contains("activeNetwork") ||
                                  functionText.contains("NetworkCallback")
        
        if (!hasConnectivityCheck) {
            report(CodeSmell(
                issue,
                Entity.from(expression),
                "API call without connectivity check - verify ConnectivityManager.activeNetwork before request for offline resilience"
            ))
        }
    }
}
