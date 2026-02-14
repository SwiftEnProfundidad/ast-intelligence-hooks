class ReportImpactAnalyzer {
    constructor(metricsCalculator) {
        this.metricsCalculator = metricsCalculator;
    }

    analyze(violations) {
        const withImpact = violations.filter(v => v.impactBreakdown);

        if (withImpact.length === 0) {
            return null;
        }

        const totals = withImpact.reduce((acc, v) => {
            acc.security += v.impactBreakdown.security || 0;
            acc.stability += v.impactBreakdown.stability || 0;
            acc.performance += v.impactBreakdown.performance || 0;
            acc.maintainability += v.impactBreakdown.maintainability || 0;
            acc.count++;
            return acc;
        }, { security: 0, stability: 0, performance: 0, maintainability: 0, count: 0 });

        return {
            averages: {
                security: Math.round(totals.security / totals.count),
                stability: Math.round(totals.stability / totals.count),
                performance: Math.round(totals.performance / totals.count),
                maintainability: Math.round(totals.maintainability / totals.count)
            },
            dominantImpact: this.findDominantImpact(totals),
            riskProfile: this.assessRiskProfile(totals, violations.length)
        };
    }

    findDominantImpact(totals) {
        const impacts = {
            security: totals.security,
            stability: totals.stability,
            performance: totals.performance,
            maintainability: totals.maintainability
        };

        return Object.entries(impacts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    assessRiskProfile(totals, totalCount) {
        const avgTotal = (totals.security + totals.stability + totals.performance + totals.maintainability) / (totals.count * 4);

        if (avgTotal > 70) return 'HIGH_RISK';
        if (avgTotal > 50) return 'MEDIUM_RISK';
        if (avgTotal > 30) return 'LOW_RISK';
        return 'MINIMAL_RISK';
    }

    generateRecommendations(violations) {
        const recommendations = [];

        const sortedBySeverity = [...violations]
            .filter(v => v.severityScore)
            .sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0))
            .slice(0, 5);

        sortedBySeverity.forEach((v, idx) => {
            recommendations.push({
                priority: idx + 1,
                ruleId: v.ruleId,
                filePath: v.filePath,
                line: v.line,
                severityScore: v.severityScore,
                action: v.recommendation || v.message
            });
        });

        const byCategory = this.metricsCalculator.groupByCategory(violations);
        Object.entries(byCategory).forEach(([category, violationsList]) => {
            if (violationsList.length > 5) {
                recommendations.push({
                    type: 'CATEGORY_PATTERN',
                    category,
                    count: violationsList.length,
                    action: `Consider architectural review of ${category} - ${violationsList.length} violations detected`
                });
            }
        });

        return recommendations;
    }

    extractCriticalIssues(violations) {
        const critical = violations.filter(v => v.severity === 'CRITICAL');

        return critical.map(v => ({
            ruleId: v.ruleId,
            filePath: v.filePath,
            line: v.line,
            message: v.message,
            severityScore: v.severityScore,
            impactBreakdown: v.impactBreakdown,
            recommendation: v.recommendation,
            context: {
                isCriticalPath: v.context?.isCriticalPath,
                isProduction: v.context?.isProduction,
                dependencyCount: v.context?.dependencyCount
            }
        }));
    }
}

module.exports = ReportImpactAnalyzer;
