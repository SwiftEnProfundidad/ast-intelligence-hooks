import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';
import { resolvePhase5ExecutionClosureOutputs } from './phase5-execution-closure-outputs-lib';

const validatePhase5ExecutionClosureOptions = (
  options: Phase5ExecutionClosureOptions
): void => {
  if (!options.repo.trim()) {
    throw new Error('Missing required option: repo');
  }

  if (options.requireAdapterReadiness && !options.includeAdapter) {
    throw new Error(
      'Cannot require adapter readiness when adapter flow is disabled (--skip-adapter).'
    );
  }
};

const buildAdapterCommands = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand[] => {
  if (!options.includeAdapter) {
    return [];
  }

  return [
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
    },
  ];
};

const buildAuthPreflightCommand = (
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

const buildMockConsumerAbCommand = (
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
  let triageScript = 'scripts/build-consumer-startup-triage.ts';
  const triageArgs = ['--repo', options.repo, '--out-dir', options.outDir];

  if (options.useMockConsumerTriage) {
    triageScript = 'scripts/build-mock-consumer-startup-triage.ts';
    return { script: triageScript, args: triageArgs };
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
    script: triageScript,
    args: triageArgs,
  };
};

const buildTriageCommand = (
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

const buildBlockersCommand = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand => {
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

  return {
    id: 'phase5-blockers-readiness',
    description: 'Generate Phase 5 blockers readiness report',
    script: 'scripts/build-phase5-blockers-readiness.ts',
    args: blockersArgs,
    required: true,
    outputFiles: [outputs.phase5BlockersReadiness],
  };
};

const buildClosureStatusCommand = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand => {
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

  return {
    id: 'phase5-execution-closure-status',
    description: 'Generate Phase 5 execution closure status snapshot',
    script: 'scripts/build-phase5-execution-closure-status.ts',
    args: closureStatusArgs,
    required: true,
    outputFiles: [outputs.phase5ExecutionClosureStatus],
  };
};

export const buildPhase5ExecutionClosureCommands = (
  options: Phase5ExecutionClosureOptions
): Phase5ExecutionClosureCommand[] => {
  validatePhase5ExecutionClosureOptions(options);
  const outputs = resolvePhase5ExecutionClosureOutputs(options.outDir);

  return [
    ...buildAdapterCommands(options, outputs),
    ...buildAuthPreflightCommand(options, outputs),
    ...buildMockConsumerAbCommand(options, outputs),
    buildTriageCommand(options, outputs),
    buildBlockersCommand(options, outputs),
    buildClosureStatusCommand(options, outputs),
  ];
};
