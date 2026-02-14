const env = require('../../config/env');

const fs = require('fs');
const path = require('path');
const ReportPresenter = require('./ReportPresenter');
const ReportMetricsCalculator = require('./ReportMetricsCalculator');
const ReportImpactAnalyzer = require('./ReportImpactAnalyzer');
const AuditLogger = require('../../application/services/logging/AuditLogger');

class ReportGenerator {
    constructor() {
        this.presenter = new ReportPresenter();
        this.metricsCalculator = new ReportMetricsCalculator();
        this.impactAnalyzer = new ReportImpactAnalyzer(this.metricsCalculator);
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
    }

    /**
     * Generate comprehensive violation report
     * @param {Array} violations - Enhanced violations with severity evaluation
     * @param {Object} gateResult - Quality gate result
     * @returns {Object} Report object
     */
    generate(violations, gateResult) {
        const timestamp = new Date().toISOString();

        return {
            meta: {
                timestamp,
                generator: 'AST Intelligence v2.0',
                totalViolations: violations.length,
                intelligentEvaluationEnabled: violations.some(v => v.intelligentEvaluation),
                gateStatus: gateResult.passed ? 'PASSED' : 'FAILED'
            },

            summary: this.generateSummary(violations),

            bySeverity: this.metricsCalculator.groupBySeverity(violations),

            byCategory: this.metricsCalculator.groupByCategory(violations),

            byFile: this.metricsCalculator.groupByFile(violations),

            criticalIssues: this.impactAnalyzer.extractCriticalIssues(violations),

            impactAnalysis: this.impactAnalyzer.analyze(violations),

            recommendations: this.impactAnalyzer.generateRecommendations(violations),

            metrics: this.metricsCalculator.calculate(violations),

            gateResult,

            violations: violations.map(v => this.formatViolation(v))
        };
    }

    generateSummary(violations) {
        const grouped = this.metricsCalculator.groupBySeverity(violations);

        const intelligentCount = violations.filter(v => v.intelligentEvaluation).length;
        const upgradedCount = violations.filter(v =>
            v.originalSeverity && v.severity !== v.originalSeverity &&
            this.metricsCalculator.severityRank(v.severity) > this.metricsCalculator.severityRank(v.originalSeverity)
        ).length;
        const downgradedCount = violations.filter(v =>
            v.originalSeverity && v.severity !== v.originalSeverity &&
            this.metricsCalculator.severityRank(v.severity) < this.metricsCalculator.severityRank(v.originalSeverity)
        ).length;

        return {
            total: violations.length,
            CRITICAL: grouped.CRITICAL?.length || 0,
            HIGH: grouped.HIGH?.length || 0,
            MEDIUM: grouped.MEDIUM?.length || 0,
            LOW: grouped.LOW?.length || 0,
            intelligentlyEvaluated: intelligentCount,
            upgradedBySeverityIntelligence: upgradedCount,
            downgradedBySeverityIntelligence: downgradedCount,
            averageSeverityScore: this.metricsCalculator.calculateAverageSeverityScore(violations)
        };
    }

    formatViolation(v) {
        return {
            ruleId: v.ruleId,
            severity: v.severity,
            filePath: v.filePath,
            line: v.line,
            column: v.column,
            message: v.message,
            ...(v.intelligentEvaluation && {
                originalSeverity: v.originalSeverity,
                severityScore: v.severityScore,
                baseScore: v.baseScore,
                impactBreakdown: v.impactBreakdown,
                context: v.context,
                recommendation: v.recommendation
            })
        };
    }

    /**
     * Save report to file
     */
    save(violations, gateResult, outputPath = '.audit_tmp/intelligent-report.json') {
        const report = this.generate(violations, gateResult);

        const dir = path.dirname(outputPath);
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (error) {
            // Log directory creation error but proceed if possible
            if (process.env.DEBUG) console.error(`Error creating report directory: ${error.message}`);
        }

        try {
            fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

            const textPath = outputPath.replace('.json', '.txt');
            fs.writeFileSync(textPath, this.presenter.formatText(report, gateResult));

            return { jsonPath: outputPath, textPath };
        } catch (error) {
            if (process.env.DEBUG) console.error(`Error saving report: ${error.message}`);
            // Return null or partial paths if save fails
            return { jsonPath: null, textPath: null, error: error.message };
        }
    }
}

module.exports = { ReportGenerator };
