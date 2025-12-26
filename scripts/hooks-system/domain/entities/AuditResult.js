const Finding = require('./Finding');
const { ValidationError } = require('../errors');

class AuditResult {
  constructor(findings = []) {
    this.findings = findings.filter(f => f instanceof Finding);
    this.timestamp = new Date();
    this.metadata = {
      totalFiles: 0,
      totalLines: 0,
      platforms: [],
    };
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

  getViolationsBySeverity() {
    return {
      critical: this.findings.filter(f => f.isCritical()).length,
      high: this.findings.filter(f => f.isHigh()).length,
      medium: this.findings.filter(f => f.isMedium()).length,
      low: this.findings.filter(f => f.isLow()).length,
      info: this.findings.filter(f => f.isInfo()).length,
    };
  }

  getViolationsByPlatform() {
    const platformMap = {};

    this.findings.forEach(finding => {
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
      platformMap[platform][finding.severity]++;
    });

    return platformMap;
  }

  getViolationsByRuleId() {
    const ruleMap = {};

    this.findings.forEach(finding => {
      const ruleId = finding.ruleId;
      if (!ruleMap[ruleId]) {
        ruleMap[ruleId] = [];
      }
      ruleMap[ruleId].push(finding);
    });

    return ruleMap;
  }

  getTechnicalDebtHours() {
    return this.findings.reduce((total, finding) => {
      return total + finding.getTechnicalDebtHours();
    }, 0);
  }

  getMaintainabilityIndex() {
    const baseScore = 100;
    const bySeverity = this.getViolationsBySeverity();

    const criticalPenalty = bySeverity.critical * 5;
    const highPenalty = bySeverity.high * 2;
    const mediumPenalty = bySeverity.medium * 1;
    const lowPenalty = bySeverity.low * 0.5;

    const score = baseScore - criticalPenalty - highPenalty - mediumPenalty - lowPenalty;
    return Math.max(0, Math.min(100, score));
  }

  filterByPlatform(platform) {
    const platformFindings = this.findings.filter(f =>
      f.belongsToPlatform(platform)
    );
    return new AuditResult(platformFindings);
  }

  filterBySeverity(severity) {
    const severityFindings = this.findings.filter(f =>
      f.severity === severity.toLowerCase()
    );
    return new AuditResult(severityFindings);
  }

  filterByFile(filePath) {
    const fileFindings = this.findings.filter(f =>
      f.filePath === filePath
    );
    return new AuditResult(fileFindings);
  }

  getTopViolatedRules(limit = 10) {
    const ruleMap = this.getViolationsByRuleId();

    return Object.entries(ruleMap)
      .map(([ruleId, findings]) => ({
        ruleId,
        count: findings.length,
        severity: findings[0].severity,
        examples: findings.slice(0, 3),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getTopViolatedFiles(limit = 10) {
    const fileMap = {};

    this.findings.forEach(finding => {
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

  setMetadata(totalFiles, totalLines, platforms) {
    this.metadata = {
      totalFiles,
      totalLines,
      platforms,
    };
  }

  toJSON() {
    return {
      timestamp: this.timestamp.toISOString(),
      summary: {
        totalViolations: this.getTotalViolations(),
        bySeverity: this.getViolationsBySeverity(),
        byPlatform: this.getViolationsByPlatform(),
        technicalDebtHours: this.getTechnicalDebtHours(),
        maintainabilityIndex: this.getMaintainabilityIndex(),
      },
      metadata: this.metadata,
      findings: this.findings.map(f => f.toJSON()),
    };
  }

  static fromJSON(json) {
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

module.exports = AuditResult;
