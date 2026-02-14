const Finding = require('./Finding');
const { ValidationError } = require('../errors');
const AuditScorer = require('../services/AuditScorer');
const AuditAnalyzer = require('../services/AuditAnalyzer');

class AuditResult {
    constructor(findings = []) {
        this.findings = findings.filter(f => f instanceof Finding);
        this.timestamp = new Date();
        this.metadata = {
            totalFiles: 0,
            totalLines: 0,
            platforms: []
        };
        this.scorer = new AuditScorer();
        this.analyzer = new AuditAnalyzer(this.scorer);
    }

    addFinding(finding) {
        if (!(finding instanceof Finding)) {
            throw new ValidationError('Can only add Finding instances to AuditResult', 'finding', finding);
        }
        this.findings.push(finding);
        return this;
    }

    addFindings(findings) {
        if (!Array.isArray(findings)) {
            throw new ValidationError('Findings must be an array', 'findings', findings);
        }
        findings.forEach(f => this.addFinding(f));
        return this;
    }

    hasViolations() {
        return this.findings.length > 0;
    }

    hasBlockingViolations() {
        return this.findings.some(f => f.isBlockingLevel());
    }

    getTotalViolations() {
        return this.findings.length;
    }

    getViolationsBySeverity() {
        return this.analyzer.getViolationsBySeverity(this.findings);
    }

    getViolationsByPlatform() {
        return this.analyzer.getViolationsByPlatform(this.findings);
    }

    getViolationsByRuleId() {
        return this.analyzer.getViolationsByRuleId(this.findings);
    }

    getTechnicalDebtHours() {
        return this.scorer.calculateTechnicalDebt(this.findings);
    }

    getMaintainabilityIndex() {
        return this.scorer.calculateMaintainabilityIndex(this.findings);
    }

    getSummary() {
        return {
            timestamp: this.timestamp.toISOString(),
            totalViolations: this.getTotalViolations(),
            blockingViolations: this.findings.filter(f => f.isBlockingLevel()).length,
            technicalDebtHours: this.getTechnicalDebtHours(),
            maintainabilityIndex: this.getMaintainabilityIndex(),
            bySeverity: this.getViolationsBySeverity(),
            byPlatform: this.getViolationsByPlatform()
        };
    }

    setMetadata(totalFilesOrMetadata = {}, totalLines, platforms) {
        if (typeof totalFilesOrMetadata === 'number') {
            this.metadata = {
                ...this.metadata,
                totalFiles: totalFilesOrMetadata,
                totalLines: Number(totalLines) || 0,
                platforms: Array.isArray(platforms) ? platforms : []
            };
            return this;
        }

        const metadata = totalFilesOrMetadata && typeof totalFilesOrMetadata === 'object'
            ? totalFilesOrMetadata
            : {};

        this.metadata = {
            ...this.metadata,
            ...metadata
        };
        return this;
    }

    filterByFile(filePath) {
        return new AuditResult(this.analyzer.filterByFile(this.findings, filePath))
            .setMetadata(this.metadata);
    }

    filterBySeverity(severity) {
        return new AuditResult(this.analyzer.filterBySeverity(this.findings, severity))
            .setMetadata(this.metadata);
    }

    getTopViolatedRules(limit = 10) {
        return this.analyzer.getTopViolatedRules(this.findings, limit);
    }

    getTopViolatedFiles(limit = 10) {
        return this.analyzer.getTopViolatedFiles(this.findings, limit);
    }

    filterByPlatform(platform) {
        return new AuditResult(this.analyzer.filterByPlatform(this.findings, platform))
            .setMetadata(this.metadata);
    }

    getTopViolations(limit = 10) {
        return this.analyzer.getTopViolatedRules(this.findings, limit);
    }

    toJSON() {
        const AuditResultSerializer = require('../services/AuditResultSerializer');
        return new AuditResultSerializer().toJSON(this);
    }

    static fromJSON(json) {
        const AuditResultSerializer = require('../services/AuditResultSerializer');
        return new AuditResultSerializer().fromJSON(json);
    }
}

module.exports = AuditResult;
