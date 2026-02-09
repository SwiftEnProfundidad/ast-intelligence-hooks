import type { Questioner } from './framework-menu-prompt-types';
import type { Phase5ExecutionClosurePromptResult } from './framework-menu-prompts-phase5-contract';
import { askLiveConsumerPhase5ExecutionClosurePrompt } from './framework-menu-prompts-phase5-closure-live-lib';
import { askMockConsumerPhase5ExecutionClosurePrompt } from './framework-menu-prompts-phase5-closure-mock-lib';
import { askPhase5ExecutionClosureBasePrompt } from './framework-menu-prompts-phase5-closure-shared-lib';

export const askPhase5ExecutionClosurePrompt = async (
  rl: Questioner
): Promise<Phase5ExecutionClosurePromptResult> => {
  const params = await askPhase5ExecutionClosureBasePrompt(rl);

  if (params.useMockConsumerTriage) {
    return askMockConsumerPhase5ExecutionClosurePrompt(rl, params);
  }

  return askLiveConsumerPhase5ExecutionClosurePrompt(rl, params);
};
