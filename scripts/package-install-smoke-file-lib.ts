import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const REPORTS_DIR_ROOT = join('.audit-reports', 'package-smoke');

export const ensureDirectory = (path: string): void => {
  mkdirSync(path, { recursive: true });
};

export const writeReportFile = (
  repoRoot: string,
  relativePath: string,
  content: string
): void => {
  const filePath = join(repoRoot, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(filePath, content, 'utf8');
};

export const parseEvidence = (
  filePath: string
): { version: string; stage: string; outcome: string } => {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
    version?: string;
    snapshot?: { stage?: string; outcome?: string };
  };

  return {
    version: parsed.version ?? 'missing',
    stage: parsed.snapshot?.stage ?? 'missing',
    outcome: parsed.snapshot?.outcome ?? 'missing',
  };
};
