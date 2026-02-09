import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';

export const buildBlockersCommand = (
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

export const buildClosureStatusCommand = (
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
