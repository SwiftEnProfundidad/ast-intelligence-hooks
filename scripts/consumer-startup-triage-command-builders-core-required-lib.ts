import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
  ConsumerStartupTriageOutputs,
} from './consumer-startup-triage-contract';

export const buildConsumerStartupTriageAuthCheckCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  return {
    id: 'auth-check',
    description: 'Check GitHub auth/scopes and billing probe',
    script: 'scripts/check-consumer-ci-auth.ts',
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
    id: 'ci-artifacts',
    description: 'Collect recent CI runs and artifact status',
    script: 'scripts/collect-consumer-ci-artifacts.ts',
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
