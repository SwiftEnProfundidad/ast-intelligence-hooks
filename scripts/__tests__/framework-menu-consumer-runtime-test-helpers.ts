import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const writeEmptyEvidence = (dir: string, stage: 'PRE_COMMIT' | 'PRE_PUSH'): void => {
  writeFileSync(
    join(dir, '.ai_evidence.json'),
    JSON.stringify(
      {
        snapshot: {
          stage,
          outcome: 'PASS',
          findings: [],
          files_scanned: 0,
          files_affected: 0,
        },
        severity_metrics: {
          snapshot: {
            by_severity: {
              CRITICAL: 0,
              ERROR: 0,
              WARN: 0,
              INFO: 0,
            },
          },
        },
      },
      null,
      2
    )
  );
};

export const writeEvidenceWithLines = (dir: string): void => {
  writeFileSync(
    join(dir, '.ai_evidence.json'),
    JSON.stringify(
      {
        snapshot: {
          stage: 'PRE_COMMIT',
          outcome: 'BLOCK',
          files_scanned: 12,
          files_affected: 2,
          findings: [
            {
              ruleId: 'heuristics.ts.process-exit.ast',
              severity: 'CRITICAL',
              filePath: 'apps/backend/src/runtime/process.ts',
              lines: [27, 32],
            },
            {
              ruleId: 'heuristics.ts.document-write.ast',
              severity: 'ERROR',
              filePath: 'apps/web/src/ui/banner.tsx',
              lines: 14,
            },
          ],
        },
        severity_metrics: {
          by_severity: {
            CRITICAL: 1,
            ERROR: 1,
            WARN: 0,
            INFO: 0,
          },
        },
      },
      null,
      2
    )
  );
};

export const readExportedMarkdown = (dir: string): string =>
  readFileSync(join(dir, '.audit-reports', 'pumuki-legacy-audit.md'), 'utf8');
