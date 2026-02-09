import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';
import {
  buildBlockersArgs,
  buildClosureStatusArgs,
} from './phase5-execution-closure-plan-phase5-args-lib';

export const buildBlockersCommand = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand => {
  return {
    id: 'phase5-blockers-readiness',
    description: 'Generate Phase 5 blockers readiness report',
    script: 'scripts/build-phase5-blockers-readiness.ts',
    args: buildBlockersArgs(options, outputs),
    required: true,
    outputFiles: [outputs.phase5BlockersReadiness],
  };
};

export const buildClosureStatusCommand = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand => {
  return {
    id: 'phase5-execution-closure-status',
    description: 'Generate Phase 5 execution closure status snapshot',
    script: 'scripts/build-phase5-execution-closure-status.ts',
    args: buildClosureStatusArgs(options, outputs),
    required: true,
    outputFiles: [outputs.phase5ExecutionClosureStatus],
  };
};
