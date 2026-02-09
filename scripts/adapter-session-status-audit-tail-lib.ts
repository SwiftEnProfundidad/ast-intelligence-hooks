import { existsSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import type { AdapterSessionStatusTail } from './adapter-session-status-contract';
import {
  readTailFile,
  readTailForHookLog,
  readTailForWritesLog,
} from './adapter-session-status-tail-readers-lib';

export const findLatestAuditFile = (params: {
  directory: string;
  prefix: string;
  suffix: string;
}): string | undefined => {
  if (!existsSync(params.directory)) {
    return undefined;
  }

  const matches = readdirSync(params.directory)
    .filter((entry) => entry.startsWith(params.prefix) && entry.endsWith(params.suffix))
    .sort((left, right) => right.localeCompare(left));

  if (matches.length === 0) {
    return undefined;
  }

  return join(params.directory, matches[0]);
};

export const collectAdapterSessionStatusTails = (params: {
  repoRoot: string;
  tailLines: number;
}): ReadonlyArray<AdapterSessionStatusTail> => {
  const auditDir = resolve(params.repoRoot, '.audit_tmp');
  const latestRuntime =
    findLatestAuditFile({
      directory: auditDir,
      prefix: 'cascade-hook-runtime-',
      suffix: '.log',
    }) ?? join(auditDir, 'cascade-hook-runtime-<missing>.log');
  const latestSmoke =
    findLatestAuditFile({
      directory: auditDir,
      prefix: 'cascade-hook-smoke-',
      suffix: '.log',
    }) ?? join(auditDir, 'cascade-hook-smoke-<missing>.log');
  const hookLogPath = resolve(params.repoRoot, '.audit_tmp/cascade-hook.log');
  const writesLogPath = resolve(params.repoRoot, '.audit_tmp/cascade-writes.log');

  return [
    {
      title: 'cascade-hook.log',
      path: hookLogPath,
      content: readTailForHookLog({
        filePath: hookLogPath,
        lines: params.tailLines,
        repoRoot: params.repoRoot,
      }),
    },
    {
      title: 'cascade-writes.log',
      path: writesLogPath,
      content: readTailForWritesLog({
        filePath: writesLogPath,
        lines: params.tailLines,
        repoRoot: params.repoRoot,
      }),
    },
    {
      title: basename(latestRuntime),
      path: latestRuntime,
      content: readTailFile(latestRuntime, params.tailLines),
    },
    {
      title: basename(latestSmoke),
      path: latestSmoke,
      content: readTailFile(latestSmoke, params.tailLines),
    },
  ];
};
