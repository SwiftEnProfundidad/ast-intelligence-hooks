import {
  DEFAULT_ACTIONLINT_BIN,
  DEFAULT_CONSUMER_REPO_PATH,
} from './framework-menu-runners';
import type { Questioner } from './framework-menu-prompt-types';
import type { ConsumerWorkflowLintPromptResult } from './framework-menu-prompts-consumer-contract';

export const askConsumerWorkflowLintPrompt = async (
  rl: Questioner
): Promise<ConsumerWorkflowLintPromptResult> => {
  const repoPathPrompt = await rl.question(
    `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
  );
  const actionlintBinPrompt = await rl.question(
    `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
  );
  const outPrompt = await rl.question(
    'output path [.audit-reports/consumer-triage/consumer-workflow-lint-report.md]: '
  );

  return {
    repoPath: repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH,
    actionlintBin: actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN,
    outFile:
      outPrompt.trim() || '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
  };
};
