export {
  DEFAULT_ADAPTER_REAL_SESSION_OPERATOR,
  DEFAULT_ADAPTER_REAL_SESSION_OUT_FILE,
  DEFAULT_ADAPTER_REAL_SESSION_TAIL_LINES,
  DEFAULT_ADAPTER_REAL_SESSION_VERSION,
  DEFAULT_ADAPTER_STATUS_REPORT_FILE,
  type AdapterParsedStatusReport,
  type AdapterRealSessionCliOptions,
  type AdapterRealSessionReportParams,
} from './adapter-real-session-contract';
export {
  buildAdapterRealSessionReportMarkdown,
  tailFromContent,
} from './adapter-real-session-markdown-lib';
export { parseAdapterRealSessionStatusReport } from './adapter-real-session-status-parser-lib';
import {
  DEFAULT_ADAPTER_REAL_SESSION_OPERATOR,
  DEFAULT_ADAPTER_REAL_SESSION_OUT_FILE,
  DEFAULT_ADAPTER_REAL_SESSION_TAIL_LINES,
  DEFAULT_ADAPTER_REAL_SESSION_VERSION,
  DEFAULT_ADAPTER_STATUS_REPORT_FILE,
  type AdapterRealSessionCliOptions,
} from './adapter-real-session-contract';

export const parseAdapterRealSessionArgs = (
  args: ReadonlyArray<string>
): AdapterRealSessionCliOptions => {
  const options: AdapterRealSessionCliOptions = {
    outFile: DEFAULT_ADAPTER_REAL_SESSION_OUT_FILE,
    statusReportFile: DEFAULT_ADAPTER_STATUS_REPORT_FILE,
    operator: DEFAULT_ADAPTER_REAL_SESSION_OPERATOR,
    adapterVersion: DEFAULT_ADAPTER_REAL_SESSION_VERSION,
    tailLines: DEFAULT_ADAPTER_REAL_SESSION_TAIL_LINES,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    if (arg === '--status-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --status-report');
      }
      options.statusReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--operator') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --operator');
      }
      options.operator = value;
      index += 1;
      continue;
    }

    if (arg === '--adapter-version') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --adapter-version');
      }
      options.adapterVersion = value;
      index += 1;
      continue;
    }

    if (arg === '--tail-lines') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --tail-lines');
      }

      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --tail-lines value: ${value}`);
      }

      options.tailLines = parsed;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
