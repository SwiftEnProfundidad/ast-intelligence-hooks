import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

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

export const buildSkillsLockCheckCommandArgs = (params: {
  scriptPath: string;
}): string[] => {
  const args = buildFrameworkMenuTsxCommandPrefix(params.scriptPath);
  args.push('--check');
  return args;
};

export const buildImportCustomSkillsCommandArgs = (params: {
  scriptPath: string;
}): string[] => {
  return buildFrameworkMenuTsxCommandPrefix(params.scriptPath);
};
