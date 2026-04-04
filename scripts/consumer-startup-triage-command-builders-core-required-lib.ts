import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
  ConsumerStartupTriageOutputs,
} from './consumer-startup-triage-contract';
import { resolveConsumerStartupTriageScript } from './consumer-startup-triage-script-paths-lib';

export const buildConsumerStartupTriageAuthCheckCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    ...resolveConsumerStartupTriageScript(
      import.meta.url,
      'scripts/check-consumer-ci-auth.ts'
    ),
    id: 'auth-check',
    description: 'Check GitHub auth/scopes and billing probe',
    args: ['--repo', params.options.repo, '--out', params.outputs.authReport],
    outputFile: params.outputs.authReport,
    required: true,
  };
};

export const buildConsumerStartupTriageArtifactsCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    ...resolveConsumerStartupTriageScript(
      import.meta.url,
      'scripts/collect-consumer-ci-artifacts.ts'
    ),
    id: 'ci-artifacts',
    description: 'Collect recent CI runs and artifact status',
    args: [
      '--repo',
      params.options.repo,
      '--limit',
      String(params.options.limit),
      '--out',
      params.outputs.artifactsReport,
    ],
    outputFile: params.outputs.artifactsReport,
    required: true,
  };
};
