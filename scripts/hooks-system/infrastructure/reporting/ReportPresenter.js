class ReportPresenter {
    formatText(report, gateResult) {
        let text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AST INTELLIGENCE - VIOLATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${report.meta.timestamp}
Status: ${gateResult.passed ? '✅ PASSED' : '❌ FAILED'}
${gateResult.blockedBy ? `Blocked by: ${gateResult.blockedBy} violations` : ''}

📊 SUMMARY:
  Total Violations: ${report.summary.total}
  - 🚨 CRITICAL: ${report.summary.CRITICAL}
  - ⚠️  HIGH: ${report.summary.HIGH}
  - ⚡ MEDIUM: ${report.summary.MEDIUM}
  - ℹ️  LOW: ${report.summary.LOW}

`;

        if (report.summary.intelligentlyEvaluated > 0) {
            text += `
🧠 INTELLIGENT SEVERITY EVALUATION:
  - Evaluated: ${report.summary.intelligentlyEvaluated}/${report.summary.total} (${Math.round(report.summary.intelligentlyEvaluated / report.summary.total * 100)}%)
  - Upgraded: ${report.summary.upgradedBySeverityIntelligence}
  - Downgraded: ${report.summary.downgradedBySeverityIntelligence}
  - Average Score: ${report.summary.averageSeverityScore}/100

`;
        }

        if (report.impactAnalysis) {
            text += `
📊 IMPACT ANALYSIS:
  Security:        ${report.impactAnalysis.averages.security}/100
  Stability:       ${report.impactAnalysis.averages.stability}/100
  Performance:     ${report.impactAnalysis.averages.performance}/100
  Maintainability: ${report.impactAnalysis.averages.maintainability}/100

  Dominant Impact: ${report.impactAnalysis.dominantImpact.toUpperCase()}
  Risk Profile: ${report.impactAnalysis.riskProfile}

`;
        }

        if (report.criticalIssues.length > 0) {
            text += `
🚨 CRITICAL ISSUES (MUST FIX):

`;
            report.criticalIssues.forEach((issue, idx) => {
                text += `${idx + 1}. ${issue.ruleId}
   File: ${issue.filePath}:${issue.line}
   Score: ${issue.severityScore}/100
   ${issue.message}

`;
            });
        }

        if (report.recommendations.length > 0) {
            text += `
💡 TOP RECOMMENDATIONS:

`;
            report.recommendations.slice(0, 5).forEach((rec, idx) => {
                if (rec.type === 'CATEGORY_PATTERN') {
                    text += `${idx + 1}. [${rec.category}] ${rec.action}\n`;
                } else {
                    text += `${idx + 1}. [Priority ${rec.priority}] ${rec.ruleId}
   ${rec.filePath}:${rec.line}
   Score: ${rec.severityScore}/100

`;
                }
            });
        }

        text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        return text;
    }
}

module.exports = ReportPresenter;
