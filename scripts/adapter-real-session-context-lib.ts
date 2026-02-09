import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  findLatestAuditFileRelativePath,
  readFileIfExists,
} from './adapter-real-session-fs-lib';
import { tailFromContent } from './adapter-real-session-markdown-lib';
export { runGitOrUnknown } from './adapter-real-session-git-lib';
export {
  findLatestAuditFileRelativePath,
  readFileIfExists,
} from './adapter-real-session-fs-lib';

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

export const loadAdapterAuditSnapshot = (params: {
  cwd: string;
  tailLines: number;
}): {
  runtimeLogPath?: string;
  runtimeLogContent?: string;
  runtimeLogTail: string;
  smokeLogPath?: string;
  smokeLogContent?: string;
  smokeLogTail: string;
  hookLogPath: string;
  hookLogContent?: string;
  hookLogTail: string;
  writesLogPath: string;
  writesLogContent?: string;
  writesLogTail: string;
  hasRuntimeLog: boolean;
  hasSmokeLog: boolean;
  hasHookLog: boolean;
  hasWritesLog: boolean;
} => {
  const runtimeLogPath = findLatestAuditFileRelativePath({
    cwd: params.cwd,
    directory: '.audit_tmp',
    prefix: 'cascade-hook-runtime-',
    suffix: '.log',
  });
  const smokeLogPath = findLatestAuditFileRelativePath({
    cwd: params.cwd,
    directory: '.audit_tmp',
    prefix: 'cascade-hook-smoke-',
    suffix: '.log',
  });
  const hookLogPath = '.audit_tmp/cascade-hook.log';
  const writesLogPath = '.audit_tmp/cascade-writes.log';

  const runtimeLogContent = runtimeLogPath
    ? readFileIfExists(params.cwd, runtimeLogPath)
    : undefined;
  const smokeLogContent = smokeLogPath
    ? readFileIfExists(params.cwd, smokeLogPath)
    : undefined;
  const hookLogContent = readFileIfExists(params.cwd, hookLogPath);
  const writesLogContent = readFileIfExists(params.cwd, writesLogPath);

  return {
    runtimeLogPath,
    runtimeLogContent,
    runtimeLogTail: tailFromContent(runtimeLogContent, params.tailLines),
    smokeLogPath,
    smokeLogContent,
    smokeLogTail: tailFromContent(smokeLogContent, params.tailLines),
    hookLogPath,
    hookLogContent,
    hookLogTail: tailFromContent(hookLogContent, params.tailLines),
    writesLogPath,
    writesLogContent,
    writesLogTail: tailFromContent(writesLogContent, params.tailLines),
    hasRuntimeLog: Boolean(runtimeLogPath && runtimeLogContent),
    hasSmokeLog: Boolean(smokeLogPath && smokeLogContent),
    hasHookLog: Boolean(hookLogContent),
    hasWritesLog: Boolean(writesLogContent),
  };
};
