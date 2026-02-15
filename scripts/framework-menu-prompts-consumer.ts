import type { Questioner } from './framework-menu-prompt-types';
import {
  askConsumerCiAuthCheckPrompt,
  askConsumerCiScanPrompt,
} from './framework-menu-prompts-consumer-ci-lib';
import {
  askConsumerStartupTriagePrompt,
} from './framework-menu-prompts-consumer-startup-triage-lib';
import { askConsumerWorkflowLintPrompt } from './framework-menu-prompts-consumer-workflow-lint-lib';
import {
  askConsumerSupportBundlePrompt,
} from './framework-menu-prompts-consumer-support-bundle-lib';
import { askConsumerSupportTicketDraftPrompt } from './framework-menu-prompts-consumer-support-ticket-lib';
import { askConsumerStartupUnblockStatusPrompt } from './framework-menu-prompts-consumer-unblock-status-lib';

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
