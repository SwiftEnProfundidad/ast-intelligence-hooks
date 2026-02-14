import { basename, join, resolve } from 'node:path';
import type { AdapterSessionStatusTail } from './adapter-session-status-contract';
import { findLatestAuditFile } from './adapter-session-status-audit-latest-lib';
import {
  readTailFile,
  readTailForHookLog,
  readTailForWritesLog,
} from './adapter-session-status-tail-readers-lib';

type ResolvedAuditPaths = {
  hookLogPath: string;
  writesLogPath: string;
  latestRuntime: string;
  latestSmoke: string;
};

const resolveAdapterSessionAuditPaths = (params: {
  repoRoot: string;
}): ResolvedAuditPaths => {
  const auditDir = resolve(params.repoRoot, '.audit_tmp');

  return {
    hookLogPath: resolve(params.repoRoot, '.audit_tmp/cascade-hook.log'),
    writesLogPath: resolve(params.repoRoot, '.audit_tmp/cascade-writes.log'),
    latestRuntime:
      findLatestAuditFile({
        directory: auditDir,
        prefix: 'cascade-hook-runtime-',
        suffix: '.log',
      }) ?? join(auditDir, 'cascade-hook-runtime-<missing>.log'),
    latestSmoke:
      findLatestAuditFile({
        directory: auditDir,
        prefix: 'cascade-hook-smoke-',
        suffix: '.log',
      }) ?? join(auditDir, 'cascade-hook-smoke-<missing>.log'),
  };
};

export const buildAdapterSessionStatusTailEntries = (params: {
  repoRoot: string;
  tailLines: number;
}): ReadonlyArray<AdapterSessionStatusTail> => {
  const paths = resolveAdapterSessionAuditPaths({
    repoRoot: params.repoRoot,
  });

  return [
    {
      title: 'cascade-hook.log',
      path: paths.hookLogPath,
      content: readTailForHookLog({
        filePath: paths.hookLogPath,
        lines: params.tailLines,
        repoRoot: params.repoRoot,
      }),
    },
    {
      title: 'cascade-writes.log',
      path: paths.writesLogPath,
      content: readTailForWritesLog({
        filePath: paths.writesLogPath,
        lines: params.tailLines,
        repoRoot: params.repoRoot,
      }),
    },
    {
      title: basename(paths.latestRuntime),
      path: paths.latestRuntime,
      content: readTailFile(paths.latestRuntime, params.tailLines),
    },
    {
      title: basename(paths.latestSmoke),
      path: paths.latestSmoke,
      content: readTailFile(paths.latestSmoke, params.tailLines),
    },
  ];
};
