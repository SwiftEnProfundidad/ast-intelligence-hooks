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
