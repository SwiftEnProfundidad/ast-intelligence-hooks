import { createHash } from 'node:crypto';
import { stableStringify } from '../../core/utils/stableStringify';
import { readEvidence } from '../evidence/readEvidence';
import { readTddBddEvidence, type TddBddEvidenceReadResult } from '../tdd/contract';
import { buildLocalHotspotsReport, type LocalHotspotsReport } from './analyticsHotspots';
import type { CreateOperationalMemoryRecordParams } from './operationalMemoryContract';

type OperationalMemoryEvidenceSource = {
  snapshot?: {
    stage?: string;
    outcome?: string;
    findings?: ReadonlyArray<{
      ruleId?: string;
      code?: string;
    }>;
  };
};

export type BuildOperationalMemoryRecordsFromLocalSignalsParams = {
  repoRoot?: string;
  topN?: number;
  sinceDays?: number;
  ttlDays?: number;
  now?: string;
  report?: LocalHotspotsReport;
  evidence?: OperationalMemoryEvidenceSource;
  tddBddEvidence?: TddBddEvidenceReadResult;
};

export type BuildOperationalMemoryRecordsFromLocalSignalsResult = {
  repoRoot: string;
  generatedAt: string;
  ttlDays: number;
  counts: {
    diff: number;
    tests: number;
    typecheck: number;
    total: number;
  };
  records: ReadonlyArray<CreateOperationalMemoryRecordParams>;
};

const DEFAULT_TTL_DAYS = 30;

const sha256 = (value: unknown): string =>
  createHash('sha256').update(stableStringify(value), 'utf8').digest('hex');

export const normalizeOperationalMemoryPathIdentity = (value: string): string => {
  const trimmed = value.trim();
  const withSlashes = trimmed.replace(/\\/g, '/');
  const withoutCurrentDir = withSlashes.replace(/^\.\/+/, '');
  const collapsed = withoutCurrentDir.replace(/\/{2,}/g, '/');
  const withoutLeadingSlash = collapsed.replace(/^\/+/, '');
  return withoutLeadingSlash.toLowerCase();
};

const toExpiration = (createdAt: string, ttlDays: number): string => {
  const base = new Date(createdAt).getTime();
  const ttlInMs = ttlDays * 24 * 60 * 60 * 1000;
  return new Date(base + ttlInMs).toISOString();
};

const createRecord = (params: {
  idPrefix: string;
  signalType: string;
  summary: string;
  confidence: number;
  createdAt: string;
  expiresAt: string;
  payload: unknown;
}): CreateOperationalMemoryRecordParams => {
  const signalHash = sha256(params.payload);
  const recordId = `${params.idPrefix}-${signalHash.slice(0, 12)}`;
  const signature = sha256({
    record_id: recordId,
    signal_type: params.signalType,
    signal_hash: signalHash,
  });
  return {
    recordId,
    signalType: params.signalType,
    signalHash,
    summary: params.summary,
    confidence: params.confidence,
    createdAt: params.createdAt,
    expiresAt: params.expiresAt,
    signature,
  };
};

const createDiffRecords = (params: {
  report: LocalHotspotsReport;
  createdAt: string;
  expiresAt: string;
}): ReadonlyArray<CreateOperationalMemoryRecordParams> => {
  const byPathIdentity = new Map<
    string,
    LocalHotspotsReport['hotspots'][number]
  >();

  for (const hotspot of params.report.hotspots) {
    const pathIdentity = normalizeOperationalMemoryPathIdentity(hotspot.path);
    const existing = byPathIdentity.get(pathIdentity);
    if (!existing || hotspot.rawScore > existing.rawScore) {
      byPathIdentity.set(pathIdentity, hotspot);
    }
  }

  const normalizedHotspots = Array.from(byPathIdentity.entries())
    .map(([pathIdentity, hotspot]) => ({ pathIdentity, hotspot }))
    .sort((a, b) => b.hotspot.rawScore - a.hotspot.rawScore || a.pathIdentity.localeCompare(b.pathIdentity));

  return normalizedHotspots.map(({ pathIdentity, hotspot }, index) =>
    createRecord({
      idPrefix: `diff-hotspot-${index + 1}-${sha256(pathIdentity).slice(0, 8)}`,
      signalType: 'diff.hotspot.risk',
      summary: `hotspot ${pathIdentity} score=${hotspot.rawScore} churn=${hotspot.churnTotalLines} findings=${hotspot.findingsTotal}`,
      confidence: Math.min(0.95, Math.max(0.3, 0.45 + hotspot.normalizedScore * 0.5)),
      createdAt: params.createdAt,
      expiresAt: params.expiresAt,
      payload: {
        path: hotspot.path,
        path_identity: pathIdentity,
        rank: hotspot.rank,
        raw_score: hotspot.rawScore,
        normalized_score: hotspot.normalizedScore,
        findings_total: hotspot.findingsTotal,
        churn_commits: hotspot.churnCommits,
        churn_authors: hotspot.churnDistinctAuthors,
        churn_total_lines: hotspot.churnTotalLines,
      },
    })
  );
};

const createTestsRecord = (params: {
  tddBddEvidence: TddBddEvidenceReadResult;
  createdAt: string;
  expiresAt: string;
}): CreateOperationalMemoryRecordParams => {
  if (params.tddBddEvidence.kind === 'valid') {
    const slicesTotal = params.tddBddEvidence.evidence.slices.length;
    const slicesValid = params.tddBddEvidence.evidence.slices.filter(
      (slice) =>
        slice.red.status === 'failed' &&
        slice.green.status === 'passed' &&
        slice.refactor.status === 'passed'
    ).length;
    const slicesInvalid = Math.max(0, slicesTotal - slicesValid);
    return createRecord({
      idPrefix: 'tests-tdd-bdd',
      signalType: 'tests.tdd_bdd.contract',
      summary: `tdd_bdd status=valid slices_total=${slicesTotal} slices_valid=${slicesValid} slices_invalid=${slicesInvalid}`,
      confidence: params.tddBddEvidence.integrity.valid ? 0.9 : 0.6,
      createdAt: params.createdAt,
      expiresAt: params.expiresAt,
      payload: {
        kind: params.tddBddEvidence.kind,
        path: params.tddBddEvidence.path,
        integrity_present: params.tddBddEvidence.integrity.present,
        integrity_valid: params.tddBddEvidence.integrity.valid,
        slices_total: slicesTotal,
        slices_valid: slicesValid,
        slices_invalid: slicesInvalid,
      },
    });
  }

  if (params.tddBddEvidence.kind === 'missing') {
    return createRecord({
      idPrefix: 'tests-tdd-bdd',
      signalType: 'tests.tdd_bdd.contract',
      summary: 'tdd_bdd status=missing',
      confidence: 0.3,
      createdAt: params.createdAt,
      expiresAt: params.expiresAt,
      payload: {
        kind: 'missing',
        path: params.tddBddEvidence.path,
      },
    });
  }

  return createRecord({
    idPrefix: 'tests-tdd-bdd',
    signalType: 'tests.tdd_bdd.contract',
    summary: `tdd_bdd status=invalid reason=${params.tddBddEvidence.reason}`,
    confidence: 0.2,
    createdAt: params.createdAt,
    expiresAt: params.expiresAt,
    payload: {
      kind: 'invalid',
      path: params.tddBddEvidence.path,
      reason: params.tddBddEvidence.reason,
      version: params.tddBddEvidence.version ?? null,
    },
  });
};

const isTypecheckRelatedFinding = (finding: { ruleId?: string; code?: string }): boolean => {
  const ruleId = finding.ruleId?.toLowerCase() ?? '';
  const code = finding.code?.toLowerCase() ?? '';
  return (
    ruleId.includes('typescript') ||
    ruleId.includes('common.types') ||
    ruleId.includes('.types.') ||
    code.includes('type')
  );
};

const createTypecheckRecord = (params: {
  evidence: OperationalMemoryEvidenceSource | undefined;
  createdAt: string;
  expiresAt: string;
}): CreateOperationalMemoryRecordParams => {
  const findings = params.evidence?.snapshot?.findings ?? [];
  const typecheckFindings = findings.filter((finding) => isTypecheckRelatedFinding(finding));
  const stage = params.evidence?.snapshot?.stage ?? 'UNKNOWN';
  const outcome = params.evidence?.snapshot?.outcome ?? 'UNKNOWN';

  if (!params.evidence) {
    return createRecord({
      idPrefix: 'typecheck-summary',
      signalType: 'typecheck.findings.summary',
      summary: 'typecheck evidence missing',
      confidence: 0.25,
      createdAt: params.createdAt,
      expiresAt: params.expiresAt,
      payload: {
        state: 'missing',
      },
    });
  }

  return createRecord({
    idPrefix: 'typecheck-summary',
    signalType: 'typecheck.findings.summary',
    summary: `typecheck evidence stage=${stage} outcome=${outcome} related_findings=${typecheckFindings.length}`,
    confidence: 0.75,
    createdAt: params.createdAt,
    expiresAt: params.expiresAt,
    payload: {
      state: 'present',
      stage,
      outcome,
      findings_total: findings.length,
      typecheck_related_findings: typecheckFindings.length,
      typecheck_related_rule_ids: Array.from(
        new Set(typecheckFindings.map((finding) => (finding.ruleId ?? 'unknown').toLowerCase()))
      ).sort((a, b) => a.localeCompare(b)),
    },
  });
};

export const buildOperationalMemoryRecordsFromLocalSignals = (
  params?: BuildOperationalMemoryRecordsFromLocalSignalsParams
): BuildOperationalMemoryRecordsFromLocalSignalsResult => {
  const repoRoot = params?.repoRoot ?? process.cwd();
  const now = params?.now ?? new Date().toISOString();
  const ttlDays = params?.ttlDays ?? DEFAULT_TTL_DAYS;
  const expiresAt = toExpiration(now, ttlDays);

  const report =
    params?.report ??
    buildLocalHotspotsReport({
      repoRoot,
      topN: params?.topN,
      sinceDays: params?.sinceDays,
    });
  const evidence = params?.evidence ?? readEvidence(repoRoot);
  const tddBddEvidence = params?.tddBddEvidence ?? readTddBddEvidence(repoRoot);

  const diffRecords = createDiffRecords({
    report,
    createdAt: now,
    expiresAt,
  });
  const testsRecord = createTestsRecord({
    tddBddEvidence,
    createdAt: now,
    expiresAt,
  });
  const typecheckRecord = createTypecheckRecord({
    evidence,
    createdAt: now,
    expiresAt,
  });

  const records = [...diffRecords, testsRecord, typecheckRecord].sort((a, b) =>
    a.recordId.localeCompare(b.recordId)
  );

  return {
    repoRoot,
    generatedAt: now,
    ttlDays,
    counts: {
      diff: diffRecords.length,
      tests: 1,
      typecheck: 1,
      total: records.length,
    },
    records,
  };
};
