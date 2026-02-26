import { basename, resolve } from 'node:path';
import { readEvidence } from '../evidence/readEvidence';
import {
  createHotspotsSaasIngestionPayload,
  type HotspotsSaasIngestionPayloadV1,
  type HotspotsSaasIngestionSourceMode,
} from './saasIngestionContract';
import { buildLocalHotspotsReport } from './analyticsHotspots';
import { getCurrentPumukiVersion } from './packageInfo';

export type BuildHotspotsSaasIngestionPayloadFromLocalParams = {
  repoRoot?: string;
  tenantId: string;
  repositoryId: string;
  repositoryName?: string;
  repositoryDefaultBranch?: string;
  producerVersion?: string;
  sourceMode?: HotspotsSaasIngestionSourceMode;
  topN?: number;
  sinceDays?: number;
};

const resolveRepositoryName = (repoRoot: string, repositoryName?: string): string => {
  const candidate = repositoryName?.trim();
  if (candidate && candidate.length > 0) {
    return candidate;
  }
  const inferred = basename(resolve(repoRoot)).trim();
  if (inferred.length > 0) {
    return inferred;
  }
  return 'unknown-repository';
};

export const buildHotspotsSaasIngestionPayloadFromLocalSignals = (
  params: BuildHotspotsSaasIngestionPayloadFromLocalParams
): HotspotsSaasIngestionPayloadV1 => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const report = buildLocalHotspotsReport({
    repoRoot,
    topN: params.topN,
    sinceDays: params.sinceDays,
  });
  const evidence = readEvidence(repoRoot);
  return createHotspotsSaasIngestionPayload({
    tenantId: params.tenantId,
    repositoryId: params.repositoryId,
    repositoryName: resolveRepositoryName(repoRoot, params.repositoryName),
    repositoryDefaultBranch: params.repositoryDefaultBranch,
    producerVersion: params.producerVersion ?? getCurrentPumukiVersion(),
    sourceMode: params.sourceMode ?? 'local',
    generatedAt: report.generatedAt,
    report,
    tddBdd: evidence?.snapshot.tdd_bdd,
  });
};
