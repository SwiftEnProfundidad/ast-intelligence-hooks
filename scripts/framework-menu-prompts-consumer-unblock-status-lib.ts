import type { Questioner } from './framework-menu-prompt-types';
import type { ConsumerStartupUnblockStatusPromptResult } from './framework-menu-prompts-consumer-contract';

export const askConsumerStartupUnblockStatusPrompt = async (
  rl: Questioner
): Promise<ConsumerStartupUnblockStatusPromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const supportBundlePrompt = await rl.question(
    'support bundle path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
  );
  const authReportPrompt = await rl.question(
    'auth report path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
  );
  const workflowLintPrompt = await rl.question(
    'workflow lint report path [.audit-reports/consumer-triage/consumer-workflow-lint-report.md]: '
  );
  const outPrompt = await rl.question(
    'output path [.audit-reports/consumer-triage/consumer-startup-unblock-status.md]: '
  );

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    supportBundleFile:
      supportBundlePrompt.trim() ||
      '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
    authReportFile:
      authReportPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
    workflowLintReportFile:
      workflowLintPrompt.trim() ||
      '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
    outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
  };
};
