import type { Questioner } from './framework-menu-prompt-types';
import type { ConsumerSupportTicketDraftPromptResult } from './framework-menu-prompts-consumer-contract';

export const askConsumerSupportTicketDraftPrompt = async (
  rl: Questioner
): Promise<ConsumerSupportTicketDraftPromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const supportBundlePrompt = await rl.question(
    'support bundle path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
  );
  const authReportPrompt = await rl.question(
    'auth report path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
  );
  const outPrompt = await rl.question(
    'output path [.audit-reports/consumer-triage/consumer-support-ticket-draft.md]: '
  );

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    supportBundleFile:
      supportBundlePrompt.trim() ||
      '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
    authReportFile:
      authReportPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
    outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-support-ticket-draft.md',
  };
};
