// ===== COMMIT BLOCKING RULES =====
// Domain Layer - Business Rules
// Defines when a commit should be blocked based on audit results

class CommitBlockingRules {
  constructor() {
    this.DEFAULT_BLOCKING_SEVERITIES = ['critical', 'high'];
    this.STRICT_BLOCKING_SEVERITIES = ['critical', 'high', 'medium', 'low'];
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
    if (auditResult.hasBlockingViolations()) {
      const bySeverity = auditResult.getViolationsBySeverity();
      
      return {
        shouldBlock: true,
        reason: `Found blocking violations (CRITICAL: ${bySeverity.critical}, HIGH: ${bySeverity.high})`,
        violations: {
          critical: bySeverity.critical,
          high: bySeverity.high,
        },
      };
    }

    return {
      shouldBlock: false,
      reason: 'No blocking violations found',
      technicalDebt: auditResult.getTotalViolations(),
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

