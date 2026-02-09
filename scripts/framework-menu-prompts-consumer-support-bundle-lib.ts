import { parseInteger, type Questioner } from './framework-menu-prompt-types';
import type { ConsumerSupportBundlePromptResult } from './framework-menu-prompts-consumer-contract';

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
