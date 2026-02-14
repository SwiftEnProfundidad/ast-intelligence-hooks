
class CommitBlockingRules {
  constructor() {
    this.LEGACY_BLOCKING_SEVERITIES = ['critical', 'high'];
    this.DEFAULT_BLOCKING_SEVERITIES = ['critical', 'high', 'medium', 'low'];
    this.STRICT_BLOCKING_SEVERITIES = ['critical', 'high', 'medium', 'low'];
  }

  getBlockingMode() {
    const mode = (process.env.AST_BLOCKING_MODE || 'DEFAULT').toUpperCase();
    if (mode === 'LEGACY') return this.LEGACY_BLOCKING_SEVERITIES;
    return this.DEFAULT_BLOCKING_SEVERITIES;
  }

  shouldBlockCommit(auditResult, strictMode = false, blockOnlyCriticalHigh = false) {
    if (!auditResult.hasViolations()) {
      return {
        shouldBlock: false,
        reason: 'No violations found',
      };
    }

    if (blockOnlyCriticalHigh) {
      return this.blockOnCriticalHigh(auditResult);
    }

    if (strictMode) {
      return this.blockOnAnyViolation(auditResult);
    }

    return this.blockOnBlockingLevels(auditResult);
  }

  shouldBlockByStagedFiles(stagedFindings, strictMode = false) {
    if (stagedFindings.length === 0) {
      return {
        shouldBlock: false,
        reason: 'No violations in staged files',
      };
    }

    const blockingFindings = stagedFindings.filter(f => f.isBlockingLevel());

    if (strictMode) {
      return {
        shouldBlock: stagedFindings.length > 0,
        reason: `Found ${stagedFindings.length} violation(s) in staged files (strict mode)`,
        violations: stagedFindings.length,
      };
    }

    if (blockingFindings.length > 0) {
      const bySeverity = {
        critical: blockingFindings.filter(f => f.isCritical()).length,
        high: blockingFindings.filter(f => f.isHigh()).length,
        medium: blockingFindings.filter(f => f.isMedium()).length,
        low: blockingFindings.filter(f => f.isLow()).length,
      };

      return {
        shouldBlock: true,
        reason: `Found ${blockingFindings.length} blocking violation(s) in staged files`,
        violations: bySeverity,
      };
    }

    return {
      shouldBlock: false,
      reason: 'No blocking violations in staged files',
      technicalDebt: stagedFindings.length,
    };
  }

  blockOnAnyViolation(auditResult) {
    const bySeverity = auditResult.getViolationsBySeverity();

    return {
      shouldBlock: true,
      reason: 'Strict mode: Any violation blocks commit',
      violations: bySeverity,
      total: auditResult.getTotalViolations(),
    };
  }

  blockOnCriticalHigh(auditResult) {
    const bySeverity = auditResult.getViolationsBySeverity();
    const blockingCount = bySeverity.critical + bySeverity.high;

    if (blockingCount > 0) {
      return {
        shouldBlock: true,
        reason: `Found ${blockingCount} CRITICAL/HIGH violation(s)`,
        violations: {
          critical: bySeverity.critical,
          high: bySeverity.high,
        },
      };
    }

    return {
      shouldBlock: false,
      reason: 'No CRITICAL/HIGH violations',
      technicalDebt: bySeverity.medium + bySeverity.low,
    };
  }

  blockOnBlockingLevels(auditResult) {
    const bySeverity = auditResult.getViolationsBySeverity();
    const blockingMode = this.getBlockingMode();
    const totalBlocking = blockingMode.reduce((sum, sev) => sum + (bySeverity[sev] || 0), 0);

    if (totalBlocking > 0) {
      return {
        shouldBlock: true,
        reason: `Found ${totalBlocking} blocking violation(s) (CRITICAL: ${bySeverity.critical}, HIGH: ${bySeverity.high}, MEDIUM: ${bySeverity.medium}, LOW: ${bySeverity.low})`,
        violations: bySeverity,
      };
    }

    return {
      shouldBlock: false,
      reason: 'No blocking violations found',
      technicalDebt: 0,
    };
  }

  calculateTechnicalDebtThreshold(auditResult, maxDebtHours = 100) {
    const totalDebtHours = auditResult.getTechnicalDebtHours();

    return {
      currentDebt: totalDebtHours,
      maxAllowed: maxDebtHours,
      exceedsThreshold: totalDebtHours > maxDebtHours,
      message: `Technical debt: ${totalDebtHours}h / ${maxDebtHours}h max`,
    };
  }

  getMaintainabilityGate(auditResult, minScore = 60) {
    const score = auditResult.getMaintainabilityIndex();

    return {
      score,
      minScore,
      passes: score >= minScore,
      message: `Maintainability Index: ${score.toFixed(1)}/100 (min ${minScore})`,
    };
  }
}

module.exports = CommitBlockingRules;
