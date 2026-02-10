import {
  DEFAULT_ADAPTER_REAL_SESSION_OPERATOR,
  DEFAULT_ADAPTER_REAL_SESSION_OUT_FILE,
  DEFAULT_ADAPTER_REAL_SESSION_TAIL_LINES,
  DEFAULT_ADAPTER_REAL_SESSION_VERSION,
  DEFAULT_ADAPTER_STATUS_REPORT_FILE,
  type AdapterRealSessionCliOptions,
} from './adapter-real-session-contract';
import {
  applyAdapterRealSessionValueArg,
  isAdapterRealSessionValueArg,
} from './adapter-real-session-arg-values-lib';

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

    if (isAdapterRealSessionValueArg(arg)) {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      applyAdapterRealSessionValueArg({
        options,
        arg,
        value,
      });
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
