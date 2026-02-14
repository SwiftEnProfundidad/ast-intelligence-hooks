import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type AdapterReadinessCliOptions = {
  adapterReportFile: string;
  outFile: string;
};

export const DEFAULT_ADAPTER_READINESS_REPORT_FILE =
  '.audit-reports/adapter/adapter-real-session-report.md';
export const DEFAULT_ADAPTER_READINESS_OUT_FILE =
  '.audit-reports/adapter/adapter-readiness.md';

export const parseAdapterReadinessArgs = (
  args: ReadonlyArray<string>
): AdapterReadinessCliOptions => {
  const options: AdapterReadinessCliOptions = {
    adapterReportFile: DEFAULT_ADAPTER_READINESS_REPORT_FILE,
    outFile: DEFAULT_ADAPTER_READINESS_OUT_FILE,
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

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

export const readAdapterReadinessInput = (
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
