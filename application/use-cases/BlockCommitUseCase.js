
const CommitBlockingRules = require('../../domain/rules/CommitBlockingRules');

class BlockCommitUseCase {
  constructor(commitBlockingRules) {
    this.commitBlockingRules = commitBlockingRules || new CommitBlockingRules();
  }

  async execute(auditResult, options = {}) {
    const strictMode = options.strictMode || false;
    const blockOnlyCriticalHigh = options.blockOnlyCriticalHigh || false;
    const useStagedOnly = options.useStagedOnly || false;

    try {
      let decision;

      if (useStagedOnly && auditResult.findings) {
        decision = this.commitBlockingRules.shouldBlockByStagedFiles(
          auditResult.findings,
          strictMode
        );
      } else {
        decision = this.commitBlockingRules.shouldBlockCommit(
          auditResult,
          strictMode,
          blockOnlyCriticalHigh
        );
      }

      if (!decision.shouldBlock) {
        const debtCheck = this.commitBlockingRules.calculateTechnicalDebtThreshold(auditResult);
        decision.technicalDebt = debtCheck.currentDebt;
        decision.debtMessage = debtCheck.message;

        const maintainabilityGate = this.commitBlockingRules.getMaintainabilityGate(auditResult);
        decision.maintainability = maintainabilityGate;
      }

      return decision;

    } catch (error) {
      throw error;
    }
  }

  formatDecisionMessage(decision) {
    const lines = [];

    if (decision.shouldBlock) {
      lines.push('');
      lines.push('❌ COMMIT BLOCKED');
      lines.push('═'.repeat(60));
      lines.push(`Reason: ${decision.reason}`);

      if (decision.violations) {
        lines.push('');
        lines.push('Violations:');
        Object.entries(decision.violations).forEach(([severity, count]) => {
          if (count > 0) {
            const emoji = severity === 'critical' ? '🔴' : '🟠';
            lines.push(`  ${emoji} ${severity.toUpperCase()}: ${count}`);
          }
        });
      }

      lines.push('');
      lines.push('🔧 Please fix these violations before committing.');
      lines.push('💡 Use GIT_BYPASS_HOOK=1 for emergency bypass (not recommended).');
      lines.push('');
    } else {
      lines.push('');
      lines.push('✅ COMMIT ALLOWED');
      lines.push('═'.repeat(60));
      lines.push(`Reason: ${decision.reason}`);

      if (decision.technicalDebt && decision.technicalDebt > 0) {
        lines.push('');
        lines.push('⚠️  Technical Debt Tracking:');
        lines.push(`  ${decision.debtMessage}`);
        lines.push(`  Maintainability: ${decision.maintainability.score.toFixed(1)}/100`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}

module.exports = BlockCommitUseCase;
