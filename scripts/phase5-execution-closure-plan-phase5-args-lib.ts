import type {
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';

export const buildBlockersArgs = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): string[] => {
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

  return blockersArgs;
};

export const buildClosureStatusArgs = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): string[] => {
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

  return closureStatusArgs;
};
