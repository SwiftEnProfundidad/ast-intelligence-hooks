const tsxCommandPrefix = (scriptPath: string): string[] => {
  return ['--yes', 'tsx@4.21.0', scriptPath];
};

export const buildValidationDocsHygieneCommandArgs = (params: {
  scriptPath: string;
}): string[] => {
  return tsxCommandPrefix(params.scriptPath);
};

export const buildCleanValidationArtifactsCommandArgs = (params: {
  scriptPath: string;
  dryRun: boolean;
}): string[] => {
  const args = tsxCommandPrefix(params.scriptPath);

  if (params.dryRun) {
    args.push('--dry-run');
  }

  return args;
};

export const buildSkillsLockCheckCommandArgs = (): string[] => {
  return ['run', 'skills:lock:check'];
};
