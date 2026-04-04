import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
  ConsumerStartupTriageOutputs,
} from './consumer-startup-triage-contract';
import { resolveConsumerStartupTriageScript } from './consumer-startup-triage-script-paths-lib';

export const buildConsumerStartupTriageSupportBundleCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    ...resolveConsumerStartupTriageScript(
      import.meta.url,
      'scripts/build-consumer-startup-failure-support-bundle.ts'
    ),
    id: 'support-bundle',
    description: 'Build startup-failure support bundle',
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
