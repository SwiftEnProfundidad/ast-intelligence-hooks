import type { BuildConsumerStartupTriageCliOptions } from './build-consumer-startup-triage-contract';
import { createDefaultBuildConsumerStartupTriageCliOptions } from './build-consumer-startup-triage-contract';

export const parseBuildConsumerStartupTriageArgs = (
  args: ReadonlyArray<string>
): BuildConsumerStartupTriageCliOptions => {
  const options = createDefaultBuildConsumerStartupTriageCliOptions();

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

    if (arg === '--skip-auth-check') {
      options.includeAuthCheck = false;
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

  return options;
};
