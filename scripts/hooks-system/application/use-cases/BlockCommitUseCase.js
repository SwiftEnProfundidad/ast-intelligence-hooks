// ===== BLOCK COMMIT USE CASE =====
// Application Layer - Use Case
// Decides whether to block a Git commit based on audit results

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
      console.log(`[BlockCommitUseCase] Evaluating commit blocking...`);
      console.log(`[BlockCommitUseCase] Mode: ${strictMode ? 'STRICT' : blockOnlyCriticalHigh ? 'CRITICAL/HIGH' : 'NORMAL'}`);

      let decision;

      if (useStagedOnly && auditResult.findings) {
        // Block based on staged files only
        decision = this.commitBlockingRules.shouldBlockByStagedFiles(
          auditResult.findings,
          strictMode
        );
      } else {
        // Block based on full audit result
        decision = this.commitBlockingRules.shouldBlockCommit(
          auditResult,
          strictMode,
          blockOnlyCriticalHigh
        );
      }

      // Add technical debt info if not blocking
      if (!decision.shouldBlock) {
        const debtCheck = this.commitBlockingRules.calculateTechnicalDebtThreshold(auditResult);
        decision.technicalDebt = debtCheck.currentDebt;
        decision.debtMessage = debtCheck.message;

        const maintainabilityGate = this.commitBlockingRules.getMaintainabilityGate(auditResult);
        decision.maintainability = maintainabilityGate;
      }

      console.log(`[BlockCommitUseCase] Decision: ${decision.shouldBlock ? 'BLOCK' : 'ALLOW'}`);
      console.log(`[BlockCommitUseCase] Reason: ${decision.reason}`);

      return decision;

    } catch (error) {
      console.error(`[BlockCommitUseCase] Error:`, error.message);
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

