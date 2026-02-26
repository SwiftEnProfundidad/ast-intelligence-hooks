import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectFileChurnOwnership } from '../git/collectFileChurnOwnership';
import { composeFileTechnicalRiskSignals } from '../git/composeFileTechnicalRiskSignals';
import { rankFileHotspots } from '../git/rankFileHotspots';

type HotspotEvidenceFinding = {
  file?: unknown;
  ruleId?: unknown;
  severity?: unknown;
  lines?: unknown;
};

type HotspotReportEntry = {
  rank: number;
  path: string;
  rawScore: number;
  normalizedScore: number;
  findingsTotal: number;
  findingsByEnterpriseSeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  findingsDistinctRules: number;
  churnCommits: number;
  churnDistinctAuthors: number;
  churnTotalLines: number;
};

export type LocalHotspotsReport = {
  generatedAt: string;
  repoRoot: string;
  options: {
    topN: number;
    sinceDays: number;
  };
  totals: {
    churnSignals: number;
    technicalSignals: number;
    ranked: number;
  };
  hotspots: ReadonlyArray<HotspotReportEntry>;
};

const EVIDENCE_FILE = '.ai_evidence.json';

const toPositiveInteger = (value: number, fieldName: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return value;
};

const readEvidenceFindings = (repoRoot: string): ReadonlyArray<HotspotEvidenceFinding> => {
  const evidencePath = join(repoRoot, EVIDENCE_FILE);
  if (!existsSync(evidencePath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: {
        findings?: unknown;
      };
    };
    if (!Array.isArray(parsed.snapshot?.findings)) {
      return [];
    }
    return parsed.snapshot.findings as HotspotEvidenceFinding[];
  } catch {
    return [];
  }
};

export const buildLocalHotspotsReport = (params?: {
  repoRoot?: string;
  topN?: number;
  sinceDays?: number;
}): LocalHotspotsReport => {
  const repoRoot = params?.repoRoot ?? process.cwd();
  const topN = toPositiveInteger(params?.topN ?? 10, 'topN');
  const sinceDays = toPositiveInteger(params?.sinceDays ?? 90, 'sinceDays');
  const churnSignals = collectFileChurnOwnership({
    sinceDays,
  });
  const findings = readEvidenceFindings(repoRoot);
  const technicalSignals = composeFileTechnicalRiskSignals({
    churnSignals,
    findings,
    repoRoot,
  });
  const ranked = rankFileHotspots({
    signals: technicalSignals,
    topN,
  });
  return {
    generatedAt: new Date().toISOString(),
    repoRoot,
    options: {
      topN,
      sinceDays,
    },
    totals: {
      churnSignals: churnSignals.length,
      technicalSignals: technicalSignals.length,
      ranked: ranked.length,
    },
    hotspots: ranked.map((entry) => ({
      rank: entry.rank,
      path: entry.path,
      rawScore: entry.rawScore,
      normalizedScore: entry.normalizedScore,
      findingsTotal: entry.signal.findingsTotal,
      findingsByEnterpriseSeverity: {
        CRITICAL: entry.signal.findingsByEnterpriseSeverity.CRITICAL,
        HIGH: entry.signal.findingsByEnterpriseSeverity.HIGH,
        MEDIUM: entry.signal.findingsByEnterpriseSeverity.MEDIUM,
        LOW: entry.signal.findingsByEnterpriseSeverity.LOW,
      },
      findingsDistinctRules: entry.signal.findingsDistinctRules,
      churnCommits: entry.signal.churnCommits,
      churnDistinctAuthors: entry.signal.churnDistinctAuthors,
      churnTotalLines: entry.signal.churnTotalLines,
    })),
  };
};
