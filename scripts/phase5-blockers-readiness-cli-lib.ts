import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type Phase5BlockersReadinessCliOptions = {
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
  requireAdapterReport: boolean;
};

export const DEFAULT_ADAPTER_REPORT_FILE = '.audit-reports/adapter/adapter-real-session-report.md';
export const DEFAULT_CONSUMER_TRIAGE_FILE =
  '.audit-reports/consumer-triage/consumer-startup-triage-report.md';
export const DEFAULT_PHASE5_BLOCKERS_READINESS_OUT_FILE =
  '.audit-reports/phase5/phase5-blockers-readiness.md';

export const parsePhase5BlockersReadinessArgs = (
  args: ReadonlyArray<string>
): Phase5BlockersReadinessCliOptions => {
  const options: Phase5BlockersReadinessCliOptions = {
    adapterReportFile: DEFAULT_ADAPTER_REPORT_FILE,
    consumerTriageReportFile: DEFAULT_CONSUMER_TRIAGE_FILE,
    outFile: DEFAULT_PHASE5_BLOCKERS_READINESS_OUT_FILE,
    requireAdapterReport: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--adapter-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --adapter-report');
      }
      options.adapterReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--consumer-triage-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --consumer-triage-report');
      }
      options.consumerTriageReportFile = value;
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

    if (arg === '--require-adapter-report') {
      options.requireAdapterReport = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

export const readPhase5BlockersReadinessInput = (
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
