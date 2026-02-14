import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const collectArtifactDirectories = (root: string): string[] => {
  if (!existsSync(root)) {
    return [];
  }

  const matches: string[] = [];

  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const nextPath = join(current, entry.name);
      if (entry.name === 'artifacts') {
        matches.push(nextPath);
        continue;
      }

      walk(nextPath);
    }
  };

  walk(root);
  return matches;
};

export const resolveValidationArtifactTargets = (repoRoot: string): string[] => {
  const docsValidationRoot = join(repoRoot, 'docs', 'validation');
  const artifactDirs = collectArtifactDirectories(docsValidationRoot);
  const auditTmp = join(repoRoot, '.audit_tmp');
  const candidates = existsSync(auditTmp) ? [...artifactDirs, auditTmp] : artifactDirs;

  return candidates.sort((left, right) => left.localeCompare(right));
};

export type CleanValidationArtifactsResult = {
  removed: ReadonlyArray<string>;
  skipped: ReadonlyArray<string>;
};

export const cleanValidationArtifacts = (params: {
  repoRoot: string;
  dryRun: boolean;
}): CleanValidationArtifactsResult => {
  const targets = resolveValidationArtifactTargets(params.repoRoot);
  const removed: string[] = [];
  const skipped: string[] = [];

  for (const target of targets) {
    if (params.dryRun) {
      skipped.push(target);
      continue;
    }

    rmSync(target, { recursive: true, force: true });
    removed.push(target);
  }

  return { removed, skipped };
};
