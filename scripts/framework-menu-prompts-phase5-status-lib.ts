import { parsePositive, type Questioner } from './framework-menu-prompt-types';
import type { Phase5ExecutionClosureStatusPromptResult } from './framework-menu-prompts-phase5-contract';

export const askPhase5ExecutionClosureStatusPrompt = async (
  rl: Questioner
): Promise<Phase5ExecutionClosureStatusPromptResult> => {
  const blockersPrompt = await rl.question(
    'phase5 blockers report path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
  );
  const consumerPrompt = await rl.question(
    'consumer unblock report path [.audit-reports/consumer-triage/consumer-startup-unblock-status.md]: '
  );
  const adapterPrompt = await rl.question(
    'adapter readiness report path [.audit-reports/adapter/adapter-readiness.md]: '
  );
  const requireAdapterPrompt = await rl.question('require adapter readiness verdict READY? [no]: ');
  const outPrompt = await rl.question(
    'output path [.audit-reports/phase5/phase5-execution-closure-status.md]: '
  );

  return {
    phase5BlockersReportFile:
      blockersPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
    consumerUnblockReportFile:
      consumerPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    adapterReadinessReportFile:
      adapterPrompt.trim() || '.audit-reports/adapter/adapter-readiness.md',
    outFile: outPrompt.trim() || '.audit-reports/phase5/phase5-execution-closure-status.md',
    requireAdapterReadiness: parsePositive(requireAdapterPrompt),
  };
};
