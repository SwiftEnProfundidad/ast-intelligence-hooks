import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';

export const buildAdapterCommands = (
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
