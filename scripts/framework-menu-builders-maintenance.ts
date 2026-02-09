import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

export const buildValidationDocsHygieneCommandArgs = (params: {
  scriptPath: string;
}): string[] => {
  return buildFrameworkMenuTsxCommandPrefix(params.scriptPath);
};

export const buildCleanValidationArtifactsCommandArgs = (params: {
  scriptPath: string;
  dryRun: boolean;
}): string[] => {
  const args = buildFrameworkMenuTsxCommandPrefix(params.scriptPath);

  if (params.dryRun) {
    args.push('--dry-run');
  }

  return args;
};

export const buildSkillsLockCheckCommandArgs = (): string[] => {
  return ['run', 'skills:lock:check'];
};
