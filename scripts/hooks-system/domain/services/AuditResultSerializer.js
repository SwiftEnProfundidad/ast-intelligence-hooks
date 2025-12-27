const Finding = require('../entities/Finding');
const AuditResult = require('../entities/AuditResult');

class AuditResultSerializer {
    toJSON(auditResult) {
        return {
            timestamp: auditResult.timestamp.toISOString(),
            summary: {
                totalViolations: auditResult.getTotalViolations(),
                bySeverity: auditResult.getViolationsBySeverity(),
                byPlatform: auditResult.getViolationsByPlatform(),
                technicalDebtHours: auditResult.getTechnicalDebtHours(),
                maintainabilityIndex: auditResult.getMaintainabilityIndex(),
            },
            metadata: auditResult.metadata,
            findings: auditResult.findings.map(f => f.toJSON()),
        };
    }

    fromJSON(json) {
        const findings = json.findings.map(f => Finding.fromJSON(f));
        const result = new AuditResult(findings);

        if (json.timestamp) {
            result.timestamp = new Date(json.timestamp);
        }
        if (json.metadata) {
            result.metadata = json.metadata;
        }

        return result;
    }
}

module.exports = AuditResultSerializer;
