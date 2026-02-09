export type AdapterSessionStatusCliOptions = {
  outFile: string;
  tailLines: number;
};

export type AdapterSessionStatusCommand = {
  label: string;
  command: string;
};

export type AdapterSessionStatusCommandExecution = {
  label: string;
  command: string;
  exitCode: number;
  output: string;
};

export type AdapterSessionStatusTail = {
  title: string;
  path: string;
  content: string;
};

export type BuildAdapterSessionStatusMarkdownParams = {
  generatedAtIso: string;
  options: AdapterSessionStatusCliOptions;
  commands: ReadonlyArray<AdapterSessionStatusCommandExecution>;
  verdict: AdapterSessionVerdict;
  tails: ReadonlyArray<AdapterSessionStatusTail>;
};

export const DEFAULT_ADAPTER_SESSION_STATUS_OUT_FILE =
  '.audit-reports/adapter/adapter-session-status.md';
export const DEFAULT_ADAPTER_SESSION_STATUS_TAIL_LINES = 80;

export const ADAPTER_SESSION_STATUS_COMMANDS: ReadonlyArray<AdapterSessionStatusCommand> = [
  {
    label: 'collect-runtime-diagnostics',
    command:
      'bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh',
  },
  {
    label: 'verify-adapter-hooks-runtime',
    command: 'npm run verify:adapter-hooks-runtime',
  },
  {
    label: 'assess-adapter-hooks-session',
    command: 'npm run assess:adapter-hooks-session',
  },
  {
    label: 'assess-adapter-hooks-session:any',
    command: 'npm run assess:adapter-hooks-session:any',
  },
];
import type { AdapterSessionVerdict } from './adapter-session-status-lib';
