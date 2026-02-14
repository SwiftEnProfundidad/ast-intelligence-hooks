export const printCleanValidationArtifactsNoTargets = (): void => {
  process.stdout.write('validation artifact cleanup: no targets found\n');
};

export const printCleanValidationArtifactsDryRun = (params: {
  skipped: ReadonlyArray<string>;
}): void => {
  process.stdout.write('validation artifact cleanup dry-run targets:\n');
  for (const target of params.skipped) {
    process.stdout.write(`- ${target}\n`);
  }
};

export const printCleanValidationArtifactsRemoved = (params: {
  removed: ReadonlyArray<string>;
}): void => {
  process.stdout.write('validation artifact cleanup removed:\n');
  for (const target of params.removed) {
    process.stdout.write(`- ${target}\n`);
  }
};
