import { cleanValidationArtifacts, resolveValidationArtifactTargets } from './clean-validation-artifacts-lib';
import { parseCleanValidationArtifactsArgs } from './clean-validation-artifacts-cli-lib';
import {
  printCleanValidationArtifactsDryRun,
  printCleanValidationArtifactsNoTargets,
  printCleanValidationArtifactsRemoved,
} from './clean-validation-artifacts-output-lib';

const main = (): number => {
  const options = parseCleanValidationArtifactsArgs(process.argv.slice(2));
  const targets = resolveValidationArtifactTargets(options.repoRoot);

  if (targets.length === 0) {
    printCleanValidationArtifactsNoTargets();
    return 0;
  }

  const result = cleanValidationArtifacts({
    repoRoot: options.repoRoot,
    dryRun: options.dryRun,
  });

  if (options.dryRun) {
    printCleanValidationArtifactsDryRun({
      skipped: result.skipped,
    });
    return 0;
  }

  printCleanValidationArtifactsRemoved({
    removed: result.removed,
  });
  return 0;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`validation artifact cleanup failed: ${message}\n`);
  process.exit(1);
}
