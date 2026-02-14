import {
  DEFAULT_ADAPTER_SESSION_STATUS_OUT_FILE,
  DEFAULT_ADAPTER_SESSION_STATUS_TAIL_LINES,
  type AdapterSessionStatusCliOptions,
} from './adapter-session-status-contract';

export const parseAdapterSessionStatusArgs = (
  args: ReadonlyArray<string>
): AdapterSessionStatusCliOptions => {
  const options: AdapterSessionStatusCliOptions = {
    outFile: DEFAULT_ADAPTER_SESSION_STATUS_OUT_FILE,
    tailLines: DEFAULT_ADAPTER_SESSION_STATUS_TAIL_LINES,
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
