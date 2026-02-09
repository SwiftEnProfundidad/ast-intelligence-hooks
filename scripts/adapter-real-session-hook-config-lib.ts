import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const loadAdapterHookConfigSnapshot = (params: {
  cwd: string;
  homeDir?: string;
}): {
  hookConfigPath: string;
  hookConfigExists: boolean;
  hookConfigContent?: string;
} => {
  const hookConfigPath = '~/.codeium/adapter/hooks.json';
  const homeDir = params.homeDir ?? process.env.HOME ?? params.cwd;
  const absoluteHookConfigPath = resolve(homeDir, '.codeium/adapter/hooks.json');
  const hookConfigExists = existsSync(absoluteHookConfigPath);

  return {
    hookConfigPath,
    hookConfigExists,
    hookConfigContent: hookConfigExists
      ? readFileSync(absoluteHookConfigPath, 'utf8')
      : undefined,
  };
};
