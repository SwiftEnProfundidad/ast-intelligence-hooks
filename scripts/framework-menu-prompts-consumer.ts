import type { Questioner } from './framework-menu-prompt-types';
import {
  askConsumerCiAuthCheckPrompt,
  askConsumerCiScanPrompt,
} from './framework-menu-prompts-consumer-ci-lib';
import {
  askConsumerStartupTriagePrompt,
  askConsumerWorkflowLintPrompt,
} from './framework-menu-prompts-consumer-workflow-lib';
import {
  askConsumerStartupUnblockStatusPrompt,
  askConsumerSupportBundlePrompt,
  askConsumerSupportTicketDraftPrompt,
} from './framework-menu-prompts-consumer-support-lib';

export const createConsumerPrompts = (rl: Questioner) => {
  return {
    askConsumerCiScan: () => askConsumerCiScanPrompt(rl),
    askConsumerWorkflowLint: () => askConsumerWorkflowLintPrompt(rl),
    askConsumerCiAuthCheck: () => askConsumerCiAuthCheckPrompt(rl),
    askConsumerSupportBundle: () => askConsumerSupportBundlePrompt(rl),
    askConsumerSupportTicketDraft: () => askConsumerSupportTicketDraftPrompt(rl),
    askConsumerStartupUnblockStatus: () => askConsumerStartupUnblockStatusPrompt(rl),
    askConsumerStartupTriage: () => askConsumerStartupTriagePrompt(rl),
  };
};
