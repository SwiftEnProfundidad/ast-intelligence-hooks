import type { AdapterSessionVerdict } from './adapter-session-status-lib';

export type AdapterSessionStatusCliOptions = {
  outFile: string;
  tailLines: number;
};

export type AdapterSessionStatusCommandAvailability = 'available' | 'unavailable';

export type AdapterSessionStatusCommand = {
  label: string;
  command: string;
  availability: AdapterSessionStatusCommandAvailability;
  unavailableReason?: string;
};

export type AdapterSessionStatusCommandExecution = {
  label: string;
  command: string;
  availability: AdapterSessionStatusCommandAvailability;
  exitCode?: number;
  output: string;
  unavailableReason?: string;
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

export const ADAPTER_SESSION_STATUS_COMMAND_SPECS = [
  {
    label: 'collect-runtime-diagnostics',
    scriptName: null,
    command:
      'node ./node_modules/pumuki/scripts/build-adapter-session-status.ts --out .audit-reports/adapter/adapter-session-status.md',
    unavailableReason:
      'Legacy runtime diagnostics script was removed and this consumer does not expose a direct replacement.',
  },
  {
    label: 'verify-adapter-hooks-runtime',
    scriptName: 'verify:adapter-hooks-runtime',
    command: 'npm run verify:adapter-hooks-runtime',
  },
  {
    label: 'assess-adapter-hooks-session',
    scriptName: 'assess:adapter-hooks-session',
    command: 'npm run assess:adapter-hooks-session',
  },
  {
    label: 'assess-adapter-hooks-session:any',
    scriptName: 'assess:adapter-hooks-session:any',
    command: 'npm run assess:adapter-hooks-session:any',
  },
] as const;

export type AdapterSessionStatusCommandSpec = (typeof ADAPTER_SESSION_STATUS_COMMAND_SPECS)[number];
