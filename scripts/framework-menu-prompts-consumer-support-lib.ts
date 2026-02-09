import { parseInteger, type Questioner } from './framework-menu-prompt-types';
import type {
  ConsumerStartupUnblockStatusPromptResult,
  ConsumerSupportBundlePromptResult,
  ConsumerSupportTicketDraftPromptResult,
} from './framework-menu-prompts-consumer-contract';

export const askConsumerSupportBundlePrompt = async (
  rl: Questioner
): Promise<ConsumerSupportBundlePromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const limitPrompt = await rl.question('runs to inspect [20]: ');
  const outPrompt = await rl.question(
    'output path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
  );

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    limit: parseInteger(limitPrompt, 20),
    outFile:
      outPrompt.trim() ||
      '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
  };
};

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
