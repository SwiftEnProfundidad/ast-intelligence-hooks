const Finding = require('./Finding');
const { ValidationError } = require('../errors');
const AuditScorer = require('../services/AuditScorer');
const AuditAnalyzer = require('../services/AuditAnalyzer');
const AuditResultSerializer = require('../services/AuditResultSerializer');

class AuditResult {
    constructor(findings = []) {
        this.findings = findings.filter(f => f instanceof Finding);
        this.timestamp = new Date();
        this.metadata = {
            totalFiles: 0,
            totalLines: 0,
            platforms: [],
            session: null,
            action: null
        };
        this.scorer = new AuditScorer();
        this.analyzer = new AuditAnalyzer(this.scorer);
        this.serializer = new AuditResultSerializer();
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

    setMetadata(metadata = {}) {
        this.metadata = {
            ...this.metadata,
            ...metadata
        };
        return this;
    }

    filterByPlatform(platform) {
        return new AuditResult(this.analyzer.filterByPlatform(this.findings, platform))
            .setMetadata(this.metadata);
    }

    getTopViolations(limit = 10) {
        return this.analyzer.getTopViolatedRules(this.findings, limit);
    }

    toJSON() {
        return this.serializer.toJSON(this);
    }

    static fromJSON(json) {
        const serializer = new AuditResultSerializer();
        return serializer.fromJSON(json);
    }
}

module.exports = AuditResult;
