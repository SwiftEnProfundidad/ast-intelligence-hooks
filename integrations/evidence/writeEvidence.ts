import { writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type {
  AiEvidenceV2_1,
  CompatibilityViolation,
  EvidenceLines,
  LedgerEntry,
  RepoState,
  SnapshotEvaluationMetrics,
  SnapshotFinding,
} from './schema';
import type { TddBddSnapshot } from '../tdd/types';
import { buildSnapshotPlatformSummaries } from './platformSummary';
import { normalizeHumanIntent } from './humanIntent';
import { normalizeSnapshotEvaluationMetrics } from './evaluationMetrics';
import { normalizeSnapshotRulesCoverage } from './rulesCoverage';

export type WriteEvidenceResult = {
  ok: boolean;
  path: string;
  error?: string;
};

const EVIDENCE_FILE_NAME = '.ai_evidence.json';

const normalizeLines = (lines?: EvidenceLines): EvidenceLines | undefined => {
  if (typeof lines === 'undefined') {
    return undefined;
  }
  if (typeof lines === 'string') {
    const trimmed = lines.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof lines === 'number') {
    return Number.isFinite(lines) ? Math.trunc(lines) : undefined;
  }

  const normalized = Array.from(
    new Set(lines.filter((line) => Number.isFinite(line)).map((line) => Math.trunc(line)))
  ).sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : undefined;
};

const linesKey = (lines?: EvidenceLines): string => {
  if (typeof lines === 'undefined') {
    return '';
  }
  if (typeof lines === 'string' || typeof lines === 'number') {
    return String(lines);
  }
  return lines.join(',');
};

const findingKey = (finding: Pick<SnapshotFinding, 'ruleId' | 'file' | 'lines'>): string => {
  return `${finding.ruleId}::${finding.file}::${linesKey(finding.lines)}`;
};

const ledgerKey = (entry: Pick<LedgerEntry, 'ruleId' | 'file' | 'lines'>): string => {
  return `${entry.ruleId}::${entry.file}::${linesKey(entry.lines)}`;
};

const toRelativeRepoPath = (repoRoot: string, inputPath: string): string => {
  const normalized = inputPath.replace(/\\/g, '/');
  const absolutePath = isAbsolute(normalized)
    ? normalized
    : resolve(repoRoot, normalized);
  const rel = relative(repoRoot, absolutePath).replace(/\\/g, '/');
  if (rel.length > 0 && !rel.startsWith('..')) {
    return rel;
  }
  return normalized;
};

const normalizeFindingPath = (
  finding: SnapshotFinding,
  repoRoot: string
): SnapshotFinding => {
  return {
    ruleId: finding.ruleId,
    severity: finding.severity,
    code: finding.code,
    message: finding.message,
    file: toRelativeRepoPath(repoRoot, finding.file),
    lines: normalizeLines(finding.lines),
    matchedBy: finding.matchedBy,
    source: finding.source,
  };
};

const normalizeLedgerPath = (entry: LedgerEntry, repoRoot: string): LedgerEntry => {
  return {
    ruleId: entry.ruleId,
    file: toRelativeRepoPath(repoRoot, entry.file),
    lines: normalizeLines(entry.lines),
    firstSeen: entry.firstSeen,
    lastSeen: entry.lastSeen,
  };
};

const toCompatibilityViolations = (
  findings: ReadonlyArray<SnapshotFinding>
): CompatibilityViolation[] => {
  return findings.map((finding) => ({
    ruleId: finding.ruleId,
    level: finding.severity,
    code: finding.code,
    message: finding.message,
    file: finding.file,
    lines: finding.lines,
    matchedBy: finding.matchedBy,
    source: finding.source,
  }));
};

const deriveFilesAffected = (findings: ReadonlyArray<SnapshotFinding>): number => {
  const files = new Set<string>();
  for (const finding of findings) {
    const file = finding.file.trim();
    if (file.length === 0) {
      continue;
    }
    files.add(file);
  }
  return files.size;
};

const normalizeRepoState = (
  repoState: RepoState | undefined,
  repoRoot: string
): RepoState | undefined => {
  if (!repoState) {
    return undefined;
  }
  return {
    repo_root: toRelativeRepoPath(repoRoot, repoState.repo_root),
    git: {
      available: repoState.git.available,
      branch: repoState.git.branch ?? null,
      upstream: repoState.git.upstream ?? null,
      ahead: Number.isFinite(repoState.git.ahead) ? Math.max(0, Math.trunc(repoState.git.ahead)) : 0,
      behind: Number.isFinite(repoState.git.behind) ? Math.max(0, Math.trunc(repoState.git.behind)) : 0,
      dirty: repoState.git.dirty,
      staged: Number.isFinite(repoState.git.staged) ? Math.max(0, Math.trunc(repoState.git.staged)) : 0,
      unstaged: Number.isFinite(repoState.git.unstaged)
        ? Math.max(0, Math.trunc(repoState.git.unstaged))
        : 0,
    },
    lifecycle: {
      installed: repoState.lifecycle.installed,
      package_version: repoState.lifecycle.package_version ?? null,
      lifecycle_version: repoState.lifecycle.lifecycle_version ?? null,
      hooks: {
        pre_commit: repoState.lifecycle.hooks.pre_commit,
        pre_push: repoState.lifecycle.hooks.pre_push,
      },
      hard_mode: repoState.lifecycle.hard_mode
        ? {
          enabled: repoState.lifecycle.hard_mode.enabled,
          profile: repoState.lifecycle.hard_mode.profile ?? null,
          config_path: toRelativeRepoPath(repoRoot, repoState.lifecycle.hard_mode.config_path),
        }
        : undefined,
    },
  };
};

const normalizeTddBddSnapshot = (snapshot: TddBddSnapshot | undefined): TddBddSnapshot | undefined => {
  if (!snapshot) {
    return undefined;
  }
  return {
    status: snapshot.status,
    scope: {
      in_scope: snapshot.scope.in_scope,
      is_new_feature: snapshot.scope.is_new_feature,
      is_complex_change: snapshot.scope.is_complex_change,
      reasons: [...snapshot.scope.reasons],
      metrics: {
        changed_files: snapshot.scope.metrics.changed_files,
        estimated_loc: snapshot.scope.metrics.estimated_loc,
        critical_path_files: snapshot.scope.metrics.critical_path_files,
        public_interface_files: snapshot.scope.metrics.public_interface_files,
      },
    },
    evidence: {
      path: snapshot.evidence.path,
      state: snapshot.evidence.state,
      version: snapshot.evidence.version,
      slices_total: snapshot.evidence.slices_total,
      slices_valid: snapshot.evidence.slices_valid,
      slices_invalid: snapshot.evidence.slices_invalid,
      integrity_ok: snapshot.evidence.integrity_ok,
      errors: [...snapshot.evidence.errors],
    },
    waiver: {
      applied: snapshot.waiver.applied,
      path: snapshot.waiver.path,
      approver: snapshot.waiver.approver,
      reason: snapshot.waiver.reason,
      expires_at: snapshot.waiver.expires_at,
      invalid_reason: snapshot.waiver.invalid_reason,
    },
  };
};

const toStableEvidence = (
  evidence: AiEvidenceV2_1,
  repoRoot: string
): AiEvidenceV2_1 => {
  const normalizedFindings = evidence.snapshot.findings
    .map((finding) => normalizeFindingPath(finding, repoRoot))
    .sort((left, right) => findingKey(left).localeCompare(findingKey(right)));

  const normalizedLedger = evidence.ledger
    .map((entry) => normalizeLedgerPath(entry, repoRoot))
    .sort((left, right) => ledgerKey(left).localeCompare(ledgerKey(right)));

  const orderedPlatforms: AiEvidenceV2_1['platforms'] = {};
  for (const platform of Object.keys(evidence.platforms).sort()) {
    orderedPlatforms[platform] = {
      detected: evidence.platforms[platform].detected,
      confidence: evidence.platforms[platform].confidence,
    };
  }

  const orderedRulesets = [...evidence.rulesets]
    .map((ruleset) => ({
      platform: ruleset.platform,
      bundle: ruleset.bundle,
      hash: ruleset.hash,
    }))
    .sort((left, right) => {
      const byPlatform = left.platform.localeCompare(right.platform);
      return byPlatform !== 0 ? byPlatform : left.bundle.localeCompare(right.bundle);
    });

  const bySeverity = {
    CRITICAL: evidence.severity_metrics.by_severity.CRITICAL,
    ERROR: evidence.severity_metrics.by_severity.ERROR,
    WARN: evidence.severity_metrics.by_severity.WARN,
    INFO: evidence.severity_metrics.by_severity.INFO,
  };
  const byEnterpriseSeverity = {
    CRITICAL: bySeverity.CRITICAL,
    HIGH: bySeverity.ERROR,
    MEDIUM: bySeverity.WARN,
    LOW: bySeverity.INFO,
  };
  const normalizedHumanIntent = normalizeHumanIntent(evidence.human_intent);
  const normalizedRepoState = normalizeRepoState(evidence.repo_state, repoRoot);
  const normalizedFilesScanned =
    typeof evidence.snapshot.files_scanned === 'number' && Number.isFinite(evidence.snapshot.files_scanned)
      ? Math.max(0, Math.trunc(evidence.snapshot.files_scanned))
      : 0;
  const normalizedFilesAffected =
    typeof evidence.snapshot.files_affected === 'number' && Number.isFinite(evidence.snapshot.files_affected)
      ? Math.max(0, Math.trunc(evidence.snapshot.files_affected))
      : deriveFilesAffected(normalizedFindings);
  const normalizedEvaluationMetrics = normalizeSnapshotEvaluationMetrics(
    evidence.snapshot.evaluation_metrics
  );
  const normalizedRulesCoverage = normalizeSnapshotRulesCoverage(
    evidence.snapshot.stage,
    evidence.snapshot.rules_coverage
  );
  const normalizedTddBdd = normalizeTddBddSnapshot(evidence.snapshot.tdd_bdd);
  const normalizedAuditMode = evidence.snapshot.audit_mode === 'engine' ? 'engine' : 'gate';

  return {
    version: '2.1',
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      audit_mode: normalizedAuditMode,
      outcome: evidence.snapshot.outcome,
      files_scanned: normalizedFilesScanned,
      ...(typeof normalizedFilesAffected === 'number'
        ? { files_affected: normalizedFilesAffected }
        : {}),
      evaluation_metrics: normalizedEvaluationMetrics,
      rules_coverage: normalizedRulesCoverage,
      ...(normalizedTddBdd ? { tdd_bdd: normalizedTddBdd } : {}),
      findings: normalizedFindings,
      platforms: buildSnapshotPlatformSummaries(
        normalizedFindings.map((finding) => ({
          ruleId: finding.ruleId,
          severity: finding.severity,
          file: finding.file,
        }))
      ),
    },
    ledger: normalizedLedger,
    platforms: orderedPlatforms,
    rulesets: orderedRulesets,
    human_intent: normalizedHumanIntent,
    ai_gate: {
      status: evidence.ai_gate.status,
      violations: toCompatibilityViolations(normalizedFindings),
      human_intent: normalizedHumanIntent,
    },
    severity_metrics: {
      gate_status: evidence.severity_metrics.gate_status,
      total_violations: evidence.severity_metrics.total_violations,
      by_severity: bySeverity,
      by_enterprise_severity: byEnterpriseSeverity,
    },
    sdd_metrics: evidence.sdd_metrics
      ? {
        enforced: evidence.sdd_metrics.enforced,
        stage: evidence.sdd_metrics.stage,
        decision: {
          allowed: evidence.sdd_metrics.decision.allowed,
          code: evidence.sdd_metrics.decision.code,
          message: evidence.sdd_metrics.decision.message,
        },
      }
      : undefined,
    repo_state: normalizedRepoState,
  };
};

const resolveRepoRoot = (): string => {
  return process.cwd();
};

export function writeEvidence(
  evidence: AiEvidenceV2_1,
  options?: { repoRoot?: string }
): WriteEvidenceResult {
  const repoRoot = options?.repoRoot ?? resolveRepoRoot();
  const outputPath = join(repoRoot, EVIDENCE_FILE_NAME);

  try {
    const stableEvidence = toStableEvidence(evidence, repoRoot);
    writeFileSync(outputPath, `${JSON.stringify(stableEvidence, null, 2)}\n`, 'utf8');
    return {
      ok: true,
      path: outputPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ai-evidence] ${message}`);
    return {
      ok: false,
      path: outputPath,
      error: message,
    };
  }
}
