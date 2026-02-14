import type { Questioner } from './framework-menu-prompt-types';
import { askMockConsumerAbReportPrompt } from './framework-menu-prompts-phase5-mock-ab-lib';
import { askPhase5BlockersReadinessPrompt } from './framework-menu-prompts-phase5-blockers-lib';
import { askPhase5ExecutionClosureStatusPrompt } from './framework-menu-prompts-phase5-status-lib';
import { askPhase5ExternalHandoffPrompt } from './framework-menu-prompts-phase5-handoff-lib';
import { askPhase5ExecutionClosurePrompt } from './framework-menu-prompts-phase5-closure-lib';

export const createPhase5Prompts = (rl: Questioner) => {
  return {
    askPhase5BlockersReadiness: () => askPhase5BlockersReadinessPrompt(rl),
    askMockConsumerAbReport: () => askMockConsumerAbReportPrompt(rl),
    askPhase5ExecutionClosureStatus: () => askPhase5ExecutionClosureStatusPrompt(rl),
    askPhase5ExternalHandoff: () => askPhase5ExternalHandoffPrompt(rl),
    askPhase5ExecutionClosure: () => askPhase5ExecutionClosurePrompt(rl),
  };
};
