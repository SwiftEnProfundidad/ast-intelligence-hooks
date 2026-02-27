import { createHash } from 'node:crypto';
import { stableStringify } from '../../core/utils/stableStringify';

export type SaasFederationSignal = {
  tenant_id: string;
  repository_id: string;
  path: string;
  enterprise_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_score: number;
  churn_total_lines: number;
  generated_at: string;
  payload_hash: string;
};

export type SaasFederationAggregateLimits = {
  max_repositories: number;
  max_signals_per_repository: number;
  max_total_signals: number;
};

export type SaasFederationRepositoryAggregate = {
  tenant_id: string;
  repository_id: string;
  signals: ReadonlyArray<SaasFederationSignal>;
  totals: {
    signals: number;
    weighted_risk: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
};

export type SaasFederationAggregateResult = {
  limits: SaasFederationAggregateLimits;
  repositories: ReadonlyArray<SaasFederationRepositoryAggregate>;
  totals: {
    repositories: number;
    signals: number;
    truncated_repositories: number;
    truncated_signals: number;
  };
};

export type SaasFederationRiskScore = {
  tenant_id: string;
  repository_id: string;
  risk_score: number;
  rank: number;
};

export type SaasFederationSnapshot = {
  tenant_id: string;
  repository_id: string;
  generated_at: string;
  payload_hash: string;
  signals: number;
};

export type SaasFederationReconciliationIssue = {
  tenant_id: string;
  repository_id: string;
  code: 'hash_drift' | 'stale_snapshot';
  message: string;
};

const severityWeight: Record<SaasFederationSignal['enterprise_severity'], number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const roundToSix = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

const toNonNegative = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
};

const normalizeLimits = (
  limits: Partial<SaasFederationAggregateLimits> | undefined
): SaasFederationAggregateLimits => {
  const maxRepositories = limits?.max_repositories ?? 50;
  const maxSignalsPerRepository = limits?.max_signals_per_repository ?? 200;
  const maxTotalSignals = limits?.max_total_signals ?? 5_000;
  return {
    max_repositories: Number.isInteger(maxRepositories) && maxRepositories > 0 ? maxRepositories : 50,
    max_signals_per_repository:
      Number.isInteger(maxSignalsPerRepository) && maxSignalsPerRepository > 0
        ? maxSignalsPerRepository
        : 200,
    max_total_signals:
      Number.isInteger(maxTotalSignals) && maxTotalSignals > 0 ? maxTotalSignals : 5_000,
  };
};

const signalFingerprint = (signal: SaasFederationSignal): string => {
  return createHash('sha256')
    .update(
      stableStringify({
        tenant_id: signal.tenant_id,
        repository_id: signal.repository_id,
        path: signal.path,
        enterprise_severity: signal.enterprise_severity,
        payload_hash: signal.payload_hash,
      }),
      'utf8'
    )
    .digest('hex');
};

const compareSignals = (left: SaasFederationSignal, right: SaasFederationSignal): number => {
  const byRisk = toNonNegative(right.risk_score) - toNonNegative(left.risk_score);
  if (byRisk !== 0) {
    return byRisk;
  }
  const bySeverity = severityWeight[right.enterprise_severity] - severityWeight[left.enterprise_severity];
  if (bySeverity !== 0) {
    return bySeverity;
  }
  const byPath = left.path.localeCompare(right.path);
  if (byPath !== 0) {
    return byPath;
  }
  return signalFingerprint(left).localeCompare(signalFingerprint(right));
};

const aggregateRepository = (
  tenantId: string,
  repositoryId: string,
  signals: ReadonlyArray<SaasFederationSignal>
): SaasFederationRepositoryAggregate => {
  const critical = signals.filter((signal) => signal.enterprise_severity === 'CRITICAL').length;
  const high = signals.filter((signal) => signal.enterprise_severity === 'HIGH').length;
  const medium = signals.filter((signal) => signal.enterprise_severity === 'MEDIUM').length;
  const low = signals.filter((signal) => signal.enterprise_severity === 'LOW').length;
  const weightedRisk = roundToSix(
    signals.reduce((total, signal) => {
      return total + toNonNegative(signal.risk_score) * severityWeight[signal.enterprise_severity];
    }, 0)
  );
  return {
    tenant_id: tenantId,
    repository_id: repositoryId,
    signals,
    totals: {
      signals: signals.length,
      weighted_risk: weightedRisk,
      critical,
      high,
      medium,
      low,
    },
  };
};

export const aggregateSaasFederationSignals = (params: {
  signals: ReadonlyArray<SaasFederationSignal>;
  limits?: Partial<SaasFederationAggregateLimits>;
}): SaasFederationAggregateResult => {
  const limits = normalizeLimits(params.limits);
  const byRepository = new Map<string, SaasFederationSignal[]>();
  for (const signal of params.signals) {
    const key = `${signal.tenant_id}::${signal.repository_id}`;
    const existing = byRepository.get(key) ?? [];
    existing.push(signal);
    byRepository.set(key, existing);
  }

  const repositoryAggregates = Array.from(byRepository.entries())
    .map(([key, repositorySignals]) => {
      const [tenantId, repositoryId] = key.split('::');
      const uniqueByFingerprint = new Map<string, SaasFederationSignal>();
      for (const signal of repositorySignals) {
        uniqueByFingerprint.set(signalFingerprint(signal), signal);
      }
      const rankedSignals = Array.from(uniqueByFingerprint.values())
        .sort(compareSignals)
        .slice(0, limits.max_signals_per_repository);
      return aggregateRepository(tenantId ?? '', repositoryId ?? '', rankedSignals);
    })
    .sort((left, right) => {
      const byRisk = right.totals.weighted_risk - left.totals.weighted_risk;
      if (byRisk !== 0) {
        return byRisk;
      }
      const byTenant = left.tenant_id.localeCompare(right.tenant_id);
      if (byTenant !== 0) {
        return byTenant;
      }
      return left.repository_id.localeCompare(right.repository_id);
    })
    .slice(0, limits.max_repositories);

  const repositories: SaasFederationRepositoryAggregate[] = [];
  let includedSignals = 0;
  for (const aggregate of repositoryAggregates) {
    if (includedSignals >= limits.max_total_signals) {
      break;
    }
    const room = limits.max_total_signals - includedSignals;
    const truncatedSignals = aggregate.signals.slice(0, room);
    repositories.push(
      aggregateRepository(aggregate.tenant_id, aggregate.repository_id, truncatedSignals)
    );
    includedSignals += truncatedSignals.length;
  }

  const originalRepositoryCount = byRepository.size;
  const originalSignalCount = params.signals.length;

  return {
    limits,
    repositories,
    totals: {
      repositories: repositories.length,
      signals: repositories.reduce((total, current) => total + current.totals.signals, 0),
      truncated_repositories: Math.max(0, originalRepositoryCount - repositories.length),
      truncated_signals: Math.max(
        0,
        originalSignalCount - repositories.reduce((total, current) => total + current.totals.signals, 0)
      ),
    },
  };
};

export const buildSaasFederationRiskScores = (params: {
  aggregate: SaasFederationAggregateResult;
}): ReadonlyArray<SaasFederationRiskScore> => {
  return params.aggregate.repositories
    .map((repository, index) => ({
      tenant_id: repository.tenant_id,
      repository_id: repository.repository_id,
      risk_score: repository.totals.weighted_risk,
      rank: index + 1,
    }))
    .sort((left, right) => {
      const byScore = right.risk_score - left.risk_score;
      if (byScore !== 0) {
        return byScore;
      }
      const byTenant = left.tenant_id.localeCompare(right.tenant_id);
      if (byTenant !== 0) {
        return byTenant;
      }
      return left.repository_id.localeCompare(right.repository_id);
    })
    .map((score, index) => ({
      ...score,
      rank: index + 1,
    }));
};

export const reconcileSaasFederationSnapshots = (params: {
  snapshots: ReadonlyArray<SaasFederationSnapshot>;
  staleAfterDays?: number;
  now?: string;
}): ReadonlyArray<SaasFederationReconciliationIssue> => {
  const staleAfterDays =
    Number.isInteger(params.staleAfterDays) && (params.staleAfterDays ?? 0) > 0
      ? (params.staleAfterDays as number)
      : 14;
  const now = new Date(params.now ?? new Date().toISOString()).getTime();
  const staleAfterMs = staleAfterDays * 24 * 60 * 60 * 1000;
  const issues: SaasFederationReconciliationIssue[] = [];
  const lastByRepository = new Map<string, SaasFederationSnapshot>();

  for (const snapshot of params.snapshots) {
    const key = `${snapshot.tenant_id}::${snapshot.repository_id}`;
    const existing = lastByRepository.get(key);
    if (!existing) {
      lastByRepository.set(key, snapshot);
      continue;
    }

    const existingTs = new Date(existing.generated_at).getTime();
    const currentTs = new Date(snapshot.generated_at).getTime();
    if (currentTs >= existingTs) {
      if (snapshot.payload_hash !== existing.payload_hash) {
        issues.push({
          tenant_id: snapshot.tenant_id,
          repository_id: snapshot.repository_id,
          code: 'hash_drift',
          message: 'hash_drift',
        });
      }
      lastByRepository.set(key, snapshot);
    }
  }

  for (const latest of lastByRepository.values()) {
    const latestTs = new Date(latest.generated_at).getTime();
    if (!Number.isFinite(latestTs) || now - latestTs > staleAfterMs) {
      issues.push({
        tenant_id: latest.tenant_id,
        repository_id: latest.repository_id,
        code: 'stale_snapshot',
        message: 'stale_snapshot',
      });
    }
  }

  return issues.sort((left, right) => {
    const byTenant = left.tenant_id.localeCompare(right.tenant_id);
    if (byTenant !== 0) {
      return byTenant;
    }
    const byRepo = left.repository_id.localeCompare(right.repository_id);
    if (byRepo !== 0) {
      return byRepo;
    }
    return left.code.localeCompare(right.code);
  });
};
