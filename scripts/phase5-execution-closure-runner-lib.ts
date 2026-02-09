import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureExecution,
} from './phase5-execution-closure-lib';

export type Phase5ExecutionClosureCliOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
  useMockConsumerTriage: boolean;
  dryRun: boolean;
};

export const DEFAULT_PHASE5_EXECUTION_CLOSURE_LIMIT = 20;
export const DEFAULT_PHASE5_EXECUTION_CLOSURE_OUT_DIR = '.audit-reports/phase5';

export const parsePhase5ExecutionClosureArgs = (
  args: ReadonlyArray<string>
): Phase5ExecutionClosureCliOptions => {
  const options: Phase5ExecutionClosureCliOptions = {
    repo: '',
    limit: DEFAULT_PHASE5_EXECUTION_CLOSURE_LIMIT,
    outDir: DEFAULT_PHASE5_EXECUTION_CLOSURE_OUT_DIR,
    runWorkflowLint: true,
    includeAuthPreflight: true,
    includeAdapter: true,
    requireAdapterReadiness: false,
    useMockConsumerTriage: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }

    if (arg === '--limit') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --limit');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --limit value: ${value}`);
      }
      options.limit = parsed;
      index += 1;
      continue;
    }

    if (arg === '--out-dir') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out-dir');
      }
      options.outDir = value;
      index += 1;
      continue;
    }

    if (arg === '--repo-path') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo-path');
      }
      options.repoPath = value;
      index += 1;
      continue;
    }

    if (arg === '--actionlint-bin') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --actionlint-bin');
      }
      options.actionlintBin = value;
      index += 1;
      continue;
    }

    if (arg === '--skip-workflow-lint') {
      options.runWorkflowLint = false;
      continue;
    }

    if (arg === '--skip-auth-preflight') {
      options.includeAuthPreflight = false;
      continue;
    }

    if (arg === '--skip-adapter') {
      options.includeAdapter = false;
      continue;
    }

    if (arg === '--require-adapter-readiness') {
      options.requireAdapterReadiness = true;
      continue;
    }

    if (arg === '--mock-consumer') {
      options.useMockConsumerTriage = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  if (options.useMockConsumerTriage) {
    options.includeAuthPreflight = false;
    options.runWorkflowLint = false;
    if (!options.requireAdapterReadiness) {
      options.includeAdapter = false;
    }
  }

  return options;
};

export const buildPhase5ExecutionClosureDryRunPlan = (
  commands: ReadonlyArray<Phase5ExecutionClosureCommand>
): string => {
  const lines = ['phase5 execution closure dry-run plan:'];
  for (const command of commands) {
    lines.push(
      `- ${command.id}: npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}`
    );
  }

  return `${lines.join('\n')}\n`;
};

export const executePhase5ExecutionClosureCommands = (
  commands: ReadonlyArray<Phase5ExecutionClosureCommand>
): ReadonlyArray<Phase5ExecutionClosureExecution> => {
  const executions: Phase5ExecutionClosureExecution[] = [];

  for (const command of commands) {
    const scriptPath = resolve(process.cwd(), command.script);
    try {
      execFileSync('npx', ['--yes', 'tsx@4.21.0', scriptPath, ...command.args], {
        stdio: 'inherit',
      });
      executions.push({
        command,
        exitCode: 0,
        ok: true,
      });
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? Number((error as { status?: number }).status ?? 1)
          : 1;
      executions.push({
        command,
        exitCode: Number.isFinite(status) ? status : 1,
        ok: false,
        error: error instanceof Error ? error.message : 'unknown command failure',
      });

      if (command.id === 'consumer-auth-preflight') {
        process.stdout.write(
          'phase5 execution closure halted: consumer auth preflight failed\n'
        );
        break;
      }
    }
  }

  return executions;
};
