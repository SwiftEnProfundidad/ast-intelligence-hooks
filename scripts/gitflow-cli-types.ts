export type GitflowCommand = 'check' | 'status' | 'workflow' | 'reset';

export type Writable = {
  write: (chunk: string) => void;
};

export type GitflowCliIo = {
  out: Writable;
  err: Writable;
};

export type GitflowSnapshot = {
  available: boolean;
  branch: string | null;
  upstream: string | null;
  ahead: number;
  behind: number;
  dirty: boolean;
  staged: number;
  unstaged: number;
};

export type GitflowCommandOutcome = {
  exitCode: number;
  lines: ReadonlyArray<string>;
};
