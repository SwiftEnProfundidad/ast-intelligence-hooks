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
import { buildSnapshotPlatformSummaries } from './platformSummary';
import { normalizeHumanIntent } from './humanIntent';

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

const normalizeStringArray = (values: ReadonlyArray<string>): string[] => {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))
  ).sort();
};

const normalizeEvaluationMetrics = (
  value: SnapshotEvaluationMetrics | undefined
): SnapshotEvaluationMetrics | undefined => {
  if (!value) {
    return undefined;
  }
  const normalizeCount = (input: number): number =>
    Number.isFinite(input) ? Math.max(0, Math.trunc(input)) : 0;

  return {
    facts_total: normalizeCount(value.facts_total),
    rules_total: normalizeCount(value.rules_total),
    baseline_rules: normalizeCount(value.baseline_rules),
    heuristic_rules: normalizeCount(value.heuristic_rules),
    skills_rules: normalizeCount(value.skills_rules),
    project_rules: normalizeCount(value.project_rules),
    matched_rules: normalizeCount(value.matched_rules),
    unmatched_rules: normalizeCount(value.unmatched_rules),
    evaluated_rule_ids: normalizeStringArray(value.evaluated_rule_ids),
    matched_rule_ids: normalizeStringArray(value.matched_rule_ids),
    unmatched_rule_ids: normalizeStringArray(value.unmatched_rule_ids),
  };
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
  const normalizedHumanIntent = normalizeHumanIntent(evidence.human_intent);
  const normalizedRepoState = normalizeRepoState(evidence.repo_state, repoRoot);
  const normalizedFilesScanned =
    typeof evidence.snapshot.files_scanned === 'number' && Number.isFinite(evidence.snapshot.files_scanned)
      ? Math.max(0, Math.trunc(evidence.snapshot.files_scanned))
      : undefined;
  const normalizedFilesAffected =
    typeof evidence.snapshot.files_affected === 'number' && Number.isFinite(evidence.snapshot.files_affected)
      ? Math.max(0, Math.trunc(evidence.snapshot.files_affected))
      : deriveFilesAffected(normalizedFindings);
  const normalizedEvaluationMetrics = normalizeEvaluationMetrics(
    evidence.snapshot.evaluation_metrics
  );

  return {
    version: '2.1',
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
      ...(typeof normalizedFilesScanned === 'number'
        ? { files_scanned: normalizedFilesScanned }
        : {}),
      ...(typeof normalizedFilesAffected === 'number'
        ? { files_affected: normalizedFilesAffected }
        : {}),
      ...(normalizedEvaluationMetrics
        ? { evaluation_metrics: normalizedEvaluationMetrics }
        : {}),
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
