import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
  ConsumerStartupTriageOutputs,
} from './consumer-startup-triage-contract';
import { resolveConsumerStartupTriageScript } from './consumer-startup-triage-script-paths-lib';

export const buildConsumerStartupTriageSupportTicketDraftCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    ...resolveConsumerStartupTriageScript(
      import.meta.url,
      'scripts/build-consumer-support-ticket-draft.ts'
    ),
    id: 'support-ticket-draft',
    description: 'Build support ticket draft from auth + support bundle',
    args: [
      '--repo',
      params.options.repo,
      '--support-bundle',
      params.outputs.supportBundleReport,
      '--auth-report',
      params.outputs.authReport,
      '--out',
      params.outputs.supportTicketDraft,
    ],
    outputFile: params.outputs.supportTicketDraft,
    required: true,
  };
};

export const buildConsumerStartupTriageStartupUnblockStatusCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    ...resolveConsumerStartupTriageScript(
      import.meta.url,
      'scripts/build-consumer-startup-unblock-status.ts'
    ),
    id: 'startup-unblock-status',
    description: 'Build consolidated startup-unblock status report',
    args: [
      '--repo',
      params.options.repo,
      '--support-bundle',
      params.outputs.supportBundleReport,
      '--auth-report',
      params.outputs.authReport,
      '--workflow-lint-report',
      params.outputs.workflowLintReport,
      '--out',
      params.outputs.startupUnblockStatus,
    ],
    outputFile: params.outputs.startupUnblockStatus,
    required: true,
  };
};
