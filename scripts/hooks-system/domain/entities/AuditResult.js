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
    }

    addFindings(findings) {
        findings.forEach(f => this.addFinding(f));
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

    getTechnicalDebtHours() {
        return this.scorer.calculateTechnicalDebt(this.findings);
    }

    getMaintainabilityIndex() {
        return this.scorer.calculateMaintainabilityIndex(this.findings);
    }

    setMetadata(totalFiles, totalLines, platforms) {
        this.metadata = {
            totalFiles,
            totalLines,
            platforms,
        };
    }

    toJSON() {
        return this.serializer.toJSON(this);
    }

    static fromJSON(json) {
        // Since fromJSON is static, we instantiate the serializer or use it directly if it was static.
        // But AuditResultSerializer is an instance class.
        // Ideally fromJSON should just create the instance and populate it.
        // Let's use the serializer instance if we can, or just delegate logic.
        // For static method, we'll instantiate the serializer temporarily.
        const serializer = new AuditResultSerializer();
        return serializer.fromJSON(json);
    }
}

module.exports = AuditResult;
