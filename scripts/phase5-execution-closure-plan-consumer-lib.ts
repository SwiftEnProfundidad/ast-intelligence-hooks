import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';

export const buildAuthPreflightCommand = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand[] => {
  if (!options.includeAuthPreflight || options.useMockConsumerTriage) {
    return [];
  }

  return [
    {
      id: 'consumer-auth-preflight',
      description: 'Preflight GitHub auth/scopes and billing probe',
      script: 'scripts/check-consumer-ci-auth.ts',
      args: ['--repo', options.repo, '--out', outputs.consumerCiAuthCheck],
      required: true,
      outputFiles: [outputs.consumerCiAuthCheck],
    },
  ];
};

export const buildMockConsumerAbCommand = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand[] => {
  if (!options.useMockConsumerTriage) {
    return [];
  }

  return [
    {
      id: 'mock-consumer-ab-report',
      description: 'Generate mock consumer A/B validation report',
      script: 'scripts/build-mock-consumer-ab-report.ts',
      args: [
        '--repo',
        options.repo,
        '--out',
        outputs.mockConsumerAbReport,
        '--block-summary',
        '.audit-reports/package-smoke/block/summary.md',
        '--minimal-summary',
        '.audit-reports/package-smoke/minimal/summary.md',
        '--block-evidence',
        '.audit-reports/package-smoke/block/ci.ai_evidence.json',
        '--minimal-evidence',
        '.audit-reports/package-smoke/minimal/ci.ai_evidence.json',
      ],
      required: true,
      outputFiles: [outputs.mockConsumerAbReport],
    },
  ];
};

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
