import { parsePositive, type Questioner } from './framework-menu-prompt-types';
import type { Phase5ExecutionClosurePromptResult } from './framework-menu-prompts-phase5-contract';
import type { Phase5ExecutionClosureBasePrompt } from './framework-menu-prompts-phase5-closure-shared-lib';

export const askMockConsumerPhase5ExecutionClosurePrompt = async (
  rl: Questioner,
  params: Phase5ExecutionClosureBasePrompt
): Promise<Phase5ExecutionClosurePromptResult> => {
  const includeAdapterPrompt = await rl.question('include adapter diagnostics? [no]: ');
  const includeAdapter = parsePositive(includeAdapterPrompt);
  const requireAdapterPrompt = await rl.question('require adapter readiness verdict READY? [no]: ');

  return {
    repo: params.repo,
    limit: params.limit,
    outDir: params.outDir,
    runWorkflowLint: false,
    includeAuthPreflight: false,
    includeAdapter,
    requireAdapterReadiness: includeAdapter && parsePositive(requireAdapterPrompt),
    useMockConsumerTriage: true,
  };
};
