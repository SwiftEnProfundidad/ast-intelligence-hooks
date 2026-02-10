import { resolve } from 'node:path';

export type CleanValidationArtifactsCliOptions = {
  repoRoot: string;
  dryRun: boolean;
};

export const parseCleanValidationArtifactsArgs = (
  args: ReadonlyArray<string>
): CleanValidationArtifactsCliOptions => {
  const options: CleanValidationArtifactsCliOptions = {
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
