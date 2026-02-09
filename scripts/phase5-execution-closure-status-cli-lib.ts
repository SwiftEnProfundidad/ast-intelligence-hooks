import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type Phase5ExecutionClosureStatusCliOptions = {
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
};

export const DEFAULT_PHASE5_BLOCKERS_REPORT_FILE =
  '.audit-reports/phase5/phase5-blockers-readiness.md';
export const DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE =
  '.audit-reports/consumer-triage/consumer-startup-unblock-status.md';
export const DEFAULT_ADAPTER_READINESS_REPORT_FILE = '.audit-reports/adapter/adapter-readiness.md';
export const DEFAULT_PHASE5_EXECUTION_CLOSURE_STATUS_OUT_FILE =
  '.audit-reports/phase5/phase5-execution-closure-status.md';

export const parsePhase5ExecutionClosureStatusArgs = (
  args: ReadonlyArray<string>
): Phase5ExecutionClosureStatusCliOptions => {
  const options: Phase5ExecutionClosureStatusCliOptions = {
    phase5BlockersReportFile: DEFAULT_PHASE5_BLOCKERS_REPORT_FILE,
    consumerUnblockReportFile: DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE,
    adapterReadinessReportFile: DEFAULT_ADAPTER_READINESS_REPORT_FILE,
    outFile: DEFAULT_PHASE5_EXECUTION_CLOSURE_STATUS_OUT_FILE,
    requireAdapterReadiness: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--phase5-blockers-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --phase5-blockers-report');
      }
      options.phase5BlockersReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--consumer-unblock-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --consumer-unblock-report');
      }
      options.consumerUnblockReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--adapter-readiness-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --adapter-readiness-report');
      }
      options.adapterReadinessReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    if (arg === '--require-adapter-readiness') {
      options.requireAdapterReadiness = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

export const readPhase5ExecutionClosureStatusInput = (
  cwd: string,
  pathLike: string
): { exists: boolean; content?: string } => {
  const absolute = resolve(cwd, pathLike);
  if (!existsSync(absolute)) {
    return { exists: false };
  }

  return {
    exists: true,
    content: readFileSync(absolute, 'utf8'),
  };
};
