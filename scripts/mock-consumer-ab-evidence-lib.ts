import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EvidenceAssessment } from './mock-consumer-ab-contract';

export const assessEvidenceFile = (pathLike: string): EvidenceAssessment => {
  const absolute = resolve(process.cwd(), pathLike);

  if (!existsSync(absolute)) {
    return {
      file: pathLike,
      exists: false,
    };
  }

  try {
    const raw = readFileSync(absolute, 'utf8');
    const parsed = JSON.parse(raw) as {
      version?: string;
      snapshot?: {
        stage?: string;
        outcome?: string;
      };
    };

    return {
      file: pathLike,
      exists: true,
      version: typeof parsed.version === 'string' ? parsed.version : undefined,
      stage: typeof parsed.snapshot?.stage === 'string' ? parsed.snapshot.stage : undefined,
      outcome:
        typeof parsed.snapshot?.outcome === 'string' ? parsed.snapshot.outcome : undefined,
    };
  } catch (error) {
    return {
      file: pathLike,
      exists: true,
      parseError: error instanceof Error ? error.message : 'invalid json',
    };
  }
};

export const isEvidenceHealthy = (
  assessment: EvidenceAssessment,
  expectedOutcome: 'PASS' | 'BLOCK'
): boolean =>
  assessment.exists &&
  !assessment.parseError &&
  assessment.version === '2.1' &&
  assessment.stage === 'CI' &&
  assessment.outcome === expectedOutcome;
