class ReportMetricsCalculator {
    calculate(violations) {
        return {
            totalFiles: new Set(violations.map(v => v.filePath)).size,
            totalLines: violations.reduce((sum, v) => sum + (v.line || 0), 0),
            averageSeverityScore: this.calculateAverageSeverityScore(violations),
            severityDistribution: this.calculateSeverityDistribution(violations),
            categoryBreakdown: this.calculateCategoryBreakdown(violations),
            filesWithMostViolations: this.findFilesWithMostViolations(violations, 10)
        };
    }

    calculateAverageSeverityScore(violations) {
        const withScores = violations.filter(v => v.severityScore);
        if (withScores.length === 0) return 0;

        const total = withScores.reduce((sum, v) => sum + v.severityScore, 0);
        return Math.round(total / withScores.length);
    }

    calculateSeverityDistribution(violations) {
        const total = violations.length;
        if (total === 0) {
            return { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        }
        const grouped = this.groupBySeverity(violations);

        return {
            CRITICAL: Math.round(((grouped.CRITICAL?.length || 0) / total) * 100),
            HIGH: Math.round(((grouped.HIGH?.length || 0) / total) * 100),
            MEDIUM: Math.round(((grouped.MEDIUM?.length || 0) / total) * 100),
            LOW: Math.round(((grouped.LOW?.length || 0) / total) * 100)
        };
    }

    calculateCategoryBreakdown(violations) {
        const byCategory = this.groupByCategory(violations);

        return Object.entries(byCategory)
            .map(([category, violationsList]) => ({
                category,
                count: violationsList.length,
                percentage: Math.round((violationsList.length / violations.length) * 100) || 0,
                averageScore: this.calculateAverageSeverityScore(violationsList)
            }))
            .sort((a, b) => b.count - a.count);
    }

    findFilesWithMostViolations(violations, limit = 10) {
        const byFile = this.groupByFile(violations);

        return Object.entries(byFile)
            .map(([file, violationsList]) => ({
                file,
                count: violationsList.length,
                averageScore: this.calculateAverageSeverityScore(violationsList),
                highestSeverity: violationsList.reduce((max, v) =>
                    this.severityRank(v.severity) > this.severityRank(max) ? v.severity : max,
                    'LOW'
                )
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    groupBySeverity(violations) {
        return violations.reduce((acc, v) => {
            const severity = v.severity || 'LOW';
            if (!acc[severity]) acc[severity] = [];
            acc[severity].push(v);
            return acc;
        }, {});
    }

    groupByCategory(violations) {
        return violations.reduce((acc, v) => {
            const category = this.extractCategory(v.ruleId);
            if (!acc[category]) acc[category] = [];
            acc[category].push(v);
            return acc;
        }, {});
    }

    groupByFile(violations) {
        return violations.reduce((acc, v) => {
            const file = v.filePath;
            if (!acc[file]) acc[file] = [];
            acc[file].push(v);
            return acc;
        }, {});
    }

    extractCategory(ruleId) {
        if (!ruleId) return 'Other';
        if (ruleId.includes('solid.')) return 'SOLID Principles';
        if (ruleId.includes('clean_arch.')) return 'Clean Architecture';
        if (ruleId.includes('bdd.') || ruleId.includes('tdd.')) return 'BDD/TDD';
        if (ruleId.includes('ddd.')) return 'DDD';
        if (ruleId.includes('cqrs.')) return 'CQRS';
        if (ruleId.includes('security.')) return 'Security';
        if (ruleId.includes('performance.')) return 'Performance';
        if (ruleId.includes('testing.')) return 'Testing';
        if (ruleId.includes('typescript.') || ruleId.includes('kotlin.')) return 'Type Safety';
        if (ruleId.includes('react.') || ruleId.includes('compose.')) return 'UI Framework';
        return 'Other';
    }

    severityRank(severity) {
        const ranks = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return ranks[severity] || 0;
    }
}

module.exports = ReportMetricsCalculator;
