import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  EvidenceSeverityMetrics,
  EvidenceSnapshot,
} from './framework-menu-evidence-summary-types';

const EVIDENCE_FILE = '.ai_evidence.json';

export type EvidenceSummaryFileReadResult =
  | { status: 'missing' }
  | { status: 'invalid' }
  | {
      status: 'ok';
      snapshot: EvidenceSnapshot;
      severityMetrics?: EvidenceSeverityMetrics;
    };

export const readEvidenceSummaryFile = (
  repoRoot: string = process.cwd()
): EvidenceSummaryFileReadResult => {
  const evidencePath = join(repoRoot, EVIDENCE_FILE);
  if (!existsSync(evidencePath)) {
    return { status: 'missing' };
  }

  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: EvidenceSnapshot;
      severity_metrics?: EvidenceSeverityMetrics;
    };

    return {
      status: 'ok',
      snapshot: (parsed?.snapshot ?? {}) as EvidenceSnapshot,
      severityMetrics: parsed?.severity_metrics,
    };
  } catch {
    return { status: 'invalid' };
  }
};
