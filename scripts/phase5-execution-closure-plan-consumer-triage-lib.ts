import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';

const resolveTriageCommandConfig = (options: Phase5ExecutionClosureOptions): {
  script: string;
  args: string[];
} => {
  const triageArgs = ['--repo', options.repo, '--out-dir', options.outDir];

  if (options.useMockConsumerTriage) {
    return {
      script: 'scripts/build-mock-consumer-startup-triage.ts',
      args: triageArgs,
    };
  }

  triageArgs.push('--limit', String(options.limit));

  if (options.runWorkflowLint) {
    const repoPath = options.repoPath?.trim();
    const actionlintBin = options.actionlintBin?.trim();
    if (!repoPath || !actionlintBin) {
      throw new Error(
        'Workflow lint requires --repo-path and --actionlint-bin (or use --skip-workflow-lint).'
      );
    }
    triageArgs.push('--repo-path', repoPath, '--actionlint-bin', actionlintBin);
  } else {
    triageArgs.push('--skip-workflow-lint');
  }

  if (options.includeAuthPreflight) {
    triageArgs.push('--skip-auth-check');
  }

  return {
    script: 'scripts/build-consumer-startup-triage.ts',
    args: triageArgs,
  };
};

export const buildTriageCommand = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand => {
  const triage = resolveTriageCommandConfig(options);

  return {
    id: 'consumer-startup-triage',
    description: 'Generate consumer startup triage bundle',
    script: triage.script,
    args: triage.args,
    required: true,
    outputFiles: [
      outputs.consumerStartupTriageReport,
      outputs.consumerStartupUnblockStatus,
    ],
  };
};
