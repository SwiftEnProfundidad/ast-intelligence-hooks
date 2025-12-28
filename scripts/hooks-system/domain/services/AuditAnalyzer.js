const ValidationError = require('../../errors/ValidationError');

class AuditAnalyzer {
    constructor(scorer) {
        this.scorer = scorer;
    }

    getViolationsBySeverity(findings) {
        return {
            critical: findings.filter(f => f.isCritical()).length,
            high: findings.filter(f => f.isHigh()).length,
            medium: findings.filter(f => f.isMedium()).length,
            low: findings.filter(f => f.isLow()).length,
            info: findings.filter(f => f.isInfo()).length,
        };
    }

    getViolationsByPlatform(findings) {
        const platformMap = {};
        findings.forEach(finding => {
            const platform = finding.platform;
            if (!platformMap[platform]) {
                platformMap[platform] = {
                    total: 0,
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                    info: 0,
                };
            }
            platformMap[platform].total++;
            platformMap[platform][finding.severity.toString()]++;
        });
        return platformMap;
    }

    getViolationsByRuleId(findings) {
        const ruleMap = {};
        findings.forEach(finding => {
            const ruleId = finding.ruleId;
            if (!ruleMap[ruleId]) {
                ruleMap[ruleId] = [];
            }
            ruleMap[ruleId].push(finding);
        });
        return ruleMap;
    }

    getTopViolatedRules(findings, limit = 10) {
        const ruleMap = this.getViolationsByRuleId(findings);
        return Object.entries(ruleMap)
            .map(([ruleId, ruleFindings]) => ({
                ruleId,
                count: ruleFindings.length,
                severity: ruleFindings[0].severity.toString(),
                examples: ruleFindings.slice(0, 3),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getTopViolatedFiles(findings, limit = 10) {
        const fileMap = {};
        findings.forEach(finding => {
            if (!fileMap[finding.filePath]) {
                fileMap[finding.filePath] = {
                    filePath: finding.filePath,
                    violations: [],
                };
            }
            fileMap[finding.filePath].violations.push(finding);
        });

        return Object.values(fileMap)
            .map(file => ({
                filePath: file.filePath,
                count: file.violations.length,
                bySeverity: {
                    critical: file.violations.filter(f => f.isCritical()).length,
                    high: file.violations.filter(f => f.isHigh()).length,
                    medium: file.violations.filter(f => f.isMedium()).length,
                    low: file.violations.filter(f => f.isLow()).length,
                },
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    filterByPlatform(findings, platform) {
        return findings.filter(f => f.belongsToPlatform(platform));
    }

    filterBySeverity(findings, severity) {
        return findings.filter(f => f.severity.toString() === severity.toLowerCase());
    }

    filterByFile(findings, filePath) {
        return findings.filter(f => f.filePath === filePath);
    }
}

module.exports = AuditAnalyzer;
