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

export const buildConsumerStartupTriageWorkflowLintCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  const repoPath = params.options.repoPath?.trim();
  const actionlintBin = params.options.actionlintBin?.trim();

  if (!repoPath || !actionlintBin) {
    throw new Error(
      'Workflow lint requires --repo-path and --actionlint-bin (or use --skip-workflow-lint).'
    );
  }

  return {
    id: 'workflow-lint',
    description: 'Run semantic workflow lint on consumer repository',
    script: 'scripts/lint-consumer-workflows.ts',
    args: [
      '--repo-path',
      repoPath,
      '--actionlint-bin',
      actionlintBin,
      '--out',
      params.outputs.workflowLintReport,
    ],
    outputFile: params.outputs.workflowLintReport,
    required: false,
  };
};
