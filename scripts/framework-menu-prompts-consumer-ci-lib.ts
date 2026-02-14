import { parseInteger, type Questioner } from './framework-menu-prompt-types';
import type {
  ConsumerCiAuthCheckPromptResult,
  ConsumerCiScanPromptResult,
} from './framework-menu-prompts-consumer-contract';

export const askConsumerCiScanPrompt = async (
  rl: Questioner
): Promise<ConsumerCiScanPromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const limitPrompt = await rl.question('runs to inspect [20]: ');
  const outPrompt = await rl.question(
    'output path [.audit-reports/consumer-triage/consumer-ci-artifacts-report.md]: '
  );

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    limit: parseInteger(limitPrompt, 20),
    outFile:
      outPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-artifacts-report.md',
  };
};

export const askConsumerCiAuthCheckPrompt = async (
  rl: Questioner
): Promise<ConsumerCiAuthCheckPromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const outPrompt = await rl.question(
    'output path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
  );

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
  };
};
