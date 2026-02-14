import type { Questioner } from './framework-menu-prompt-types';
import type { Phase5BlockersReadinessPromptResult } from './framework-menu-prompts-phase5-contract';

export const askPhase5BlockersReadinessPrompt = async (
  rl: Questioner
): Promise<Phase5BlockersReadinessPromptResult> => {
  const adapterPrompt = await rl.question(
    'adapter report path [.audit-reports/adapter/adapter-real-session-report.md]: '
  );
  const consumerPrompt = await rl.question(
    'consumer triage report path [.audit-reports/consumer-triage/consumer-startup-triage-report.md]: '
  );
  const outPrompt = await rl.question(
    'output path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
  );

  return {
    adapterReportFile:
      adapterPrompt.trim() || '.audit-reports/adapter/adapter-real-session-report.md',
    consumerTriageReportFile:
      consumerPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
    outFile: outPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
  };
};
