import {
  determineAdapterSessionVerdict,
  type AdapterSessionVerdict,
} from './adapter-session-status-lib';
import {
  DEFAULT_ADAPTER_SESSION_STATUS_OUT_FILE,
  DEFAULT_ADAPTER_SESSION_STATUS_TAIL_LINES,
  type AdapterSessionStatusCliOptions,
  type AdapterSessionStatusCommandExecution,
} from './adapter-session-status-contract';
export {
  ADAPTER_SESSION_STATUS_COMMANDS,
  DEFAULT_ADAPTER_SESSION_STATUS_OUT_FILE,
  DEFAULT_ADAPTER_SESSION_STATUS_TAIL_LINES,
  type AdapterSessionStatusCliOptions,
  type AdapterSessionStatusCommand,
  type AdapterSessionStatusCommandExecution,
  type AdapterSessionStatusTail,
} from './adapter-session-status-contract';
export {
  filterHookLogLinesForRepo,
  filterWritesLogLinesForRepo,
  isPathInsideRepo,
  toTailFromText,
} from './adapter-session-status-log-filter-lib';
export { buildAdapterSessionStatusMarkdown } from './adapter-session-status-markdown-lib';

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

export const deriveAdapterSessionVerdictFromCommands = (
  commands: ReadonlyArray<AdapterSessionStatusCommandExecution>
): AdapterSessionVerdict => {
  const verifyResult = commands.find(
    (item) => item.label === 'verify-adapter-hooks-runtime'
  );
  const strictResult = commands.find(
    (item) => item.label === 'assess-adapter-hooks-session'
  );
  const anyResult = commands.find(
    (item) => item.label === 'assess-adapter-hooks-session:any'
  );

  if (!verifyResult || !strictResult || !anyResult) {
    throw new Error('Missing required command execution results.');
  }

  return determineAdapterSessionVerdict({
    verifyExitCode: verifyResult.exitCode,
    strictOutput: strictResult.output,
    anyOutput: anyResult.output,
  });
};

export const exitCodeForAdapterSessionVerdict = (
  verdict: AdapterSessionVerdict
): number => {
  if (verdict === 'PASS') {
    return 0;
  }

  if (verdict === 'NEEDS_REAL_SESSION') {
    return 2;
  }

  return 1;
};
