import {
  buildGitflowUsage,
  isGitflowCommand,
  runGitflowCommand,
  writeGitflowLines,
} from './gitflow-cli-commands';
import { readGitflowSnapshot } from './gitflow-cli-snapshot';
import type { GitflowCliIo } from './gitflow-cli-types';

export type {
  GitflowCliIo,
  GitflowCommand,
  GitflowCommandOutcome,
  GitflowSnapshot,
  Writable,
} from './gitflow-cli-types';

export {
  buildGitflowUsage,
  formatGitflowSnapshot,
  isGitflowCommand,
  runGitflowCommand,
  SUPPORTED_GITFLOW_COMMANDS,
  writeGitflowLines,
} from './gitflow-cli-commands';

export {
  parseGitflowAheadBehind,
  parseGitflowStatusShort,
  readGitflowSnapshot,
} from './gitflow-cli-snapshot';

export const runGitflowCli = (
  args: ReadonlyArray<string>,
  options?: {
    cwd?: string;
    io?: GitflowCliIo;
  }
): number => {
  const repoRoot = options?.cwd ?? process.cwd();
  const io = options?.io ?? { out: process.stdout, err: process.stderr };
  const commandInput = args[0];

  if (!isGitflowCommand(commandInput)) {
    writeGitflowLines(io.err, buildGitflowUsage());
    return 1;
  }

  const snapshot = readGitflowSnapshot(repoRoot);
  const outcome = runGitflowCommand(commandInput, snapshot);
  writeGitflowLines(io.out, outcome.lines);
  return outcome.exitCode;
};
