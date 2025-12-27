const AuditResult = require('../entities/AuditResult');

class AuditFilter {
    filterByPlatform(findings, platform) {
        return findings.filter(f => f.belongsToPlatform(platform));
    }

    filterBySeverity(findings, severity) {
        return findings.filter(f => f.severity.toString() === severity.toLowerCase());
    }

    filterByFile(findings, filePath) {
        return findings.filter(f => f.filePath === filePath);
    }

    createFilteredResult(originalResult, filterFn, filterArg) {
        const filteredFindings = filterFn(originalResult.findings, filterArg);
        const newResult = new AuditResult(filteredFindings);
        // Preserve metadata except totals which are recalculated
        newResult.metadata = { ...originalResult.metadata };
        // Recalculate specific metadata if needed? No, totals are calculated on fly or in constructor.
        return newResult;
    }
}

module.exports = AuditFilter;
