import { resolve } from 'node:path';
import { cleanValidationArtifacts, resolveValidationArtifactTargets } from './clean-validation-artifacts-lib';

type CliOptions = {
  repoRoot: string;
  dryRun: boolean;
};

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repoRoot: process.cwd(),
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo-root') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo-root');
      }
      options.repoRoot = resolve(value);
      index += 1;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));
  const targets = resolveValidationArtifactTargets(options.repoRoot);

  if (targets.length === 0) {
    process.stdout.write('validation artifact cleanup: no targets found\n');
    return 0;
  }

  const result = cleanValidationArtifacts({
    repoRoot: options.repoRoot,
    dryRun: options.dryRun,
  });

  if (options.dryRun) {
    process.stdout.write('validation artifact cleanup dry-run targets:\n');
    for (const target of result.skipped) {
      process.stdout.write(`- ${target}\n`);
    }
    return 0;
  }

  process.stdout.write('validation artifact cleanup removed:\n');
  for (const target of result.removed) {
    process.stdout.write(`- ${target}\n`);
  }
  return 0;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`validation artifact cleanup failed: ${message}\n`);
  process.exit(1);
}
