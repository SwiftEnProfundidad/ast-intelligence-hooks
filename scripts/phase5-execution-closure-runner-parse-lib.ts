import {
  DEFAULT_PHASE5_EXECUTION_CLOSURE_LIMIT,
  DEFAULT_PHASE5_EXECUTION_CLOSURE_OUT_DIR,
  type Phase5ExecutionClosureCliOptions,
} from './phase5-execution-closure-runner-contract';

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
