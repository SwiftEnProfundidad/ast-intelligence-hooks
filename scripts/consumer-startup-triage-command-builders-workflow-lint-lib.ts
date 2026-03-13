import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageOptions,
  ConsumerStartupTriageOutputs,
} from './consumer-startup-triage-contract';
import { DEFAULT_ACTIONLINT_BIN } from './framework-menu-runner-constants';

const resolveWorkflowLintInputs = (params: {
  options: ConsumerStartupTriageOptions;
}): { repoPath: string; actionlintBin: string } => {
  const repoPath = params.options.repoPath?.trim();
  const actionlintBin = params.options.actionlintBin?.trim() || DEFAULT_ACTIONLINT_BIN;

  if (!repoPath) {
    throw new Error('Workflow lint requires --repo-path (or use --skip-workflow-lint).');
  }

  return { repoPath, actionlintBin };
};

export const buildConsumerStartupTriageWorkflowLintCommand = (params: {
  options: ConsumerStartupTriageOptions;
  outputs: ConsumerStartupTriageOutputs;
}): ConsumerStartupTriageCommand => {
  const workflowLintInputs = resolveWorkflowLintInputs({
    options: params.options,
  });

  return {
    id: 'workflow-lint',
    description: 'Run semantic workflow lint on consumer repository',
    script: 'scripts/lint-consumer-workflows.ts',
    args: [
      '--repo-path',
      workflowLintInputs.repoPath,
      '--actionlint-bin',
      workflowLintInputs.actionlintBin,
      '--out',
      params.outputs.workflowLintReport,
    ],
    outputFile: params.outputs.workflowLintReport,
    required: false,
  };
};
