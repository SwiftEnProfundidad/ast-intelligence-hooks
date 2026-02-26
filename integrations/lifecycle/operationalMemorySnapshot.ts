import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import type { TddBddEvidenceReadResult } from '../tdd/contract';
import type { LocalHotspotsReport } from './analyticsHotspots';
import {
  createOperationalMemoryContract,
  writeOperationalMemoryContract,
  type OperationalMemoryContractBodyV1,
  type OperationalMemoryContractV1,
  type OperationalMemorySourceMode,
} from './operationalMemoryContract';
import {
  buildOperationalMemoryRecordsFromLocalSignals,
  type BuildOperationalMemoryRecordsFromLocalSignalsResult,
} from './operationalMemorySignals';

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

export type OperationalMemorySnapshotV1 = {
  version: '1';
  captured_at: string;
  source: {
    producer: 'pumuki';
    producer_version: string;
    mode: OperationalMemorySourceMode;
  };
  scope: OperationalMemoryContractBodyV1['scope'];
  contract: {
    path: string;
    version: OperationalMemoryContractV1['version'];
    payload_hash: string;
    records: number;
  };
  signals: BuildOperationalMemoryRecordsFromLocalSignalsResult['counts'];
};

export type AppendOperationalMemorySnapshotFromLocalSignalsParams = {
  repoRoot?: string;
  producerVersion: string;
  sourceMode?: OperationalMemorySourceMode;
  scopeId: string;
  scopeType: OperationalMemoryContractBodyV1['scope']['scope_type'];
  scopeName?: string;
  ttlDays?: number;
  minConfidence?: number;
  now?: string;
  topN?: number;
  sinceDays?: number;
  report?: LocalHotspotsReport;
  evidence?: OperationalMemoryEvidenceSource;
  tddBddEvidence?: TddBddEvidenceReadResult;
};

export type AppendOperationalMemorySnapshotFromLocalSignalsResult = {
  contract: OperationalMemoryContractV1;
  contractPath: string;
  snapshotPath: string;
  snapshot: OperationalMemorySnapshotV1;
  records: number;
};

const DEFAULT_OPERATIONAL_MEMORY_SNAPSHOTS_PATH = '.pumuki/artifacts/operational-memory-snapshots-v1.ndjson';

export const resolveOperationalMemorySnapshotsPath = (repoRoot: string): string => {
  const configured = process.env.PUMUKI_OPERATIONAL_MEMORY_SNAPSHOTS_PATH?.trim();
  const candidate =
    configured && configured.length > 0
      ? configured
      : DEFAULT_OPERATIONAL_MEMORY_SNAPSHOTS_PATH;
  if (isAbsolute(candidate)) {
    return candidate;
  }
  return resolve(repoRoot, candidate);
};

export const appendOperationalMemorySnapshotFromLocalSignals = (
  params: AppendOperationalMemorySnapshotFromLocalSignalsParams
): AppendOperationalMemorySnapshotFromLocalSignalsResult => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const now = params.now ?? new Date().toISOString();
  const sourceMode = params.sourceMode ?? 'local';
  const ttlDays = params.ttlDays ?? 30;
  const minConfidence = params.minConfidence ?? 0.5;

  const recordsResult = buildOperationalMemoryRecordsFromLocalSignals({
    repoRoot,
    now,
    ttlDays,
    topN: params.topN,
    sinceDays: params.sinceDays,
    report: params.report,
    evidence: params.evidence,
    tddBddEvidence: params.tddBddEvidence,
  });

  const contract = createOperationalMemoryContract({
    producerVersion: params.producerVersion,
    sourceMode,
    generatedAt: now,
    scopeId: params.scopeId,
    scopeType: params.scopeType,
    scopeName: params.scopeName,
    ttlDays,
    minConfidence,
    records: recordsResult.records,
  });
  const writeResult = writeOperationalMemoryContract(repoRoot, contract);

  const snapshotPath = resolveOperationalMemorySnapshotsPath(repoRoot);
  const snapshot: OperationalMemorySnapshotV1 = {
    version: '1',
    captured_at: now,
    source: {
      producer: 'pumuki',
      producer_version: params.producerVersion,
      mode: sourceMode,
    },
    scope: {
      scope_id: params.scopeId,
      scope_type: params.scopeType,
      scope_name: params.scopeName,
    },
    contract: {
      path: writeResult.path,
      version: contract.version,
      payload_hash: contract.integrity.payload_hash,
      records: contract.records.length,
    },
    signals: recordsResult.counts,
  };

  mkdirSync(dirname(snapshotPath), { recursive: true });
  appendFileSync(snapshotPath, `${JSON.stringify(snapshot)}\n`, 'utf8');

  return {
    contract,
    contractPath: writeResult.path,
    snapshotPath,
    snapshot,
    records: contract.records.length,
  };
};
