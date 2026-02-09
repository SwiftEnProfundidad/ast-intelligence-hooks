export type Phase5ExecutionClosureOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
  useMockConsumerTriage?: boolean;
};

export type Phase5ExecutionClosureOutputs = {
  adapterSessionStatus: string;
  adapterRealSessionReport: string;
  adapterReadiness: string;
  consumerCiAuthCheck: string;
  mockConsumerAbReport: string;
  consumerStartupTriageReport: string;
  consumerStartupUnblockStatus: string;
  phase5BlockersReadiness: string;
  phase5ExecutionClosureStatus: string;
  closureRunReport: string;
};

export type Phase5ExecutionClosureCommand = {
  id:
    | 'adapter-session-status'
    | 'adapter-real-session-report'
    | 'adapter-readiness'
    | 'consumer-auth-preflight'
    | 'mock-consumer-ab-report'
    | 'consumer-startup-triage'
    | 'phase5-blockers-readiness'
    | 'phase5-execution-closure-status';
  description: string;
  script: string;
  args: string[];
  required: boolean;
  outputFiles: string[];
};

const joinPath = (base: string, leaf: string): string => {
  return `${base.replace(/\/$/, '')}/${leaf}`;
};

export const resolvePhase5ExecutionClosureOutputs = (
  outDir: string
): Phase5ExecutionClosureOutputs => {
  return {
    adapterSessionStatus: joinPath(outDir, 'adapter-session-status.md'),
    adapterRealSessionReport: joinPath(outDir, 'adapter-real-session-report.md'),
    adapterReadiness: joinPath(outDir, 'adapter-readiness.md'),
    consumerCiAuthCheck: joinPath(outDir, 'consumer-ci-auth-check.md'),
    mockConsumerAbReport: joinPath(outDir, 'mock-consumer-ab-report.md'),
    consumerStartupTriageReport: joinPath(outDir, 'consumer-startup-triage-report.md'),
    consumerStartupUnblockStatus: joinPath(outDir, 'consumer-startup-unblock-status.md'),
    phase5BlockersReadiness: joinPath(outDir, 'phase5-blockers-readiness.md'),
    phase5ExecutionClosureStatus: joinPath(
      outDir,
      'phase5-execution-closure-status.md'
    ),
    closureRunReport: joinPath(outDir, 'phase5-execution-closure-run-report.md'),
  };
};

export const buildPhase5ExecutionClosureCommands = (
  options: Phase5ExecutionClosureOptions
): Phase5ExecutionClosureCommand[] => {
  if (!options.repo.trim()) {
    throw new Error('Missing required option: repo');
  }

  if (options.requireAdapterReadiness && !options.includeAdapter) {
    throw new Error(
      'Cannot require adapter readiness when adapter flow is disabled (--skip-adapter).'
    );
  }

  const outputs = resolvePhase5ExecutionClosureOutputs(options.outDir);
  const commands: Phase5ExecutionClosureCommand[] = [];

  if (options.includeAdapter) {
    commands.push(
      {
        id: 'adapter-session-status',
        description: 'Generate adapter session status report',
        script: 'scripts/build-adapter-session-status.ts',
        args: ['--out', outputs.adapterSessionStatus],
        required: options.requireAdapterReadiness,
        outputFiles: [outputs.adapterSessionStatus],
      },
      {
        id: 'adapter-real-session-report',
        description: 'Generate adapter real-session report',
        script: 'scripts/build-adapter-real-session-report.ts',
        args: [
          '--status-report',
          outputs.adapterSessionStatus,
          '--out',
          outputs.adapterRealSessionReport,
        ],
        required: options.requireAdapterReadiness,
        outputFiles: [outputs.adapterRealSessionReport],
      },
      {
        id: 'adapter-readiness',
        description: 'Generate adapter readiness report',
        script: 'scripts/build-adapter-readiness.ts',
        args: [
          '--adapter-report',
          outputs.adapterRealSessionReport,
          '--out',
          outputs.adapterReadiness,
        ],
        required: options.requireAdapterReadiness,
        outputFiles: [outputs.adapterReadiness],
      }
    );
  }

  if (options.includeAuthPreflight && !options.useMockConsumerTriage) {
    commands.push({
      id: 'consumer-auth-preflight',
      description: 'Preflight GitHub auth/scopes and billing probe',
      script: 'scripts/check-consumer-ci-auth.ts',
      args: ['--repo', options.repo, '--out', outputs.consumerCiAuthCheck],
      required: true,
      outputFiles: [outputs.consumerCiAuthCheck],
    });
  }

  if (options.useMockConsumerTriage) {
    commands.push({
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
    });
  }

  let triageScript = 'scripts/build-consumer-startup-triage.ts';
  const triageArgs = ['--repo', options.repo, '--out-dir', options.outDir];

  if (options.useMockConsumerTriage) {
    triageScript = 'scripts/build-mock-consumer-startup-triage.ts';
  } else {
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
  }

  commands.push({
    id: 'consumer-startup-triage',
    description: 'Generate consumer startup triage bundle',
    script: triageScript,
    args: triageArgs,
    required: true,
    outputFiles: [
      outputs.consumerStartupTriageReport,
      outputs.consumerStartupUnblockStatus,
    ],
  });

  const blockersArgs = [
    '--consumer-triage-report',
    outputs.consumerStartupTriageReport,
    '--out',
    outputs.phase5BlockersReadiness,
  ];

  if (options.requireAdapterReadiness) {
    blockersArgs.push(
      '--require-adapter-report',
      '--adapter-report',
      outputs.adapterRealSessionReport
    );
  }

  commands.push({
    id: 'phase5-blockers-readiness',
    description: 'Generate Phase 5 blockers readiness report',
    script: 'scripts/build-phase5-blockers-readiness.ts',
    args: blockersArgs,
    required: true,
    outputFiles: [outputs.phase5BlockersReadiness],
  });

  const closureStatusArgs = [
    '--phase5-blockers-report',
    outputs.phase5BlockersReadiness,
    '--consumer-unblock-report',
    outputs.consumerStartupUnblockStatus,
    '--out',
    outputs.phase5ExecutionClosureStatus,
  ];

  if (options.requireAdapterReadiness) {
    closureStatusArgs.push(
      '--adapter-readiness-report',
      outputs.adapterReadiness,
      '--require-adapter-readiness'
    );
  } else if (options.includeAdapter) {
    closureStatusArgs.push('--adapter-readiness-report', outputs.adapterReadiness);
  }

  commands.push({
    id: 'phase5-execution-closure-status',
    description: 'Generate Phase 5 execution closure status snapshot',
    script: 'scripts/build-phase5-execution-closure-status.ts',
    args: closureStatusArgs,
    required: true,
    outputFiles: [outputs.phase5ExecutionClosureStatus],
  });

  return commands;
};
