import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
  ConsumerStartupTriageOutputs,
} from './consumer-startup-triage-contract';

export const buildConsumerStartupTriageSupportBundleCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    id: 'support-bundle',
    description: 'Build startup-failure support bundle',
    script: 'scripts/build-consumer-startup-failure-support-bundle.ts',
    args: [
      '--repo',
      params.options.repo,
      '--limit',
      String(params.options.limit),
      '--out',
      params.outputs.supportBundleReport,
    ],
    outputFile: params.outputs.supportBundleReport,
    required: true,
  };
};

export const buildConsumerStartupTriageSupportTicketDraftCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    id: 'support-ticket-draft',
    description: 'Build support ticket draft from auth + support bundle',
    script: 'scripts/build-consumer-support-ticket-draft.ts',
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
    id: 'startup-unblock-status',
    description: 'Build consolidated startup-unblock status report',
    script: 'scripts/build-consumer-startup-unblock-status.ts',
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
