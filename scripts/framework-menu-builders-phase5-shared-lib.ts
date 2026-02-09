import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

export const buildPhase5TsxCommandPrefix = (scriptPath: string): string[] => {
  return buildFrameworkMenuTsxCommandPrefix(scriptPath);
};
