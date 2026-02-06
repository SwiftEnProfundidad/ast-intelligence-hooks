import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type {
  AiEvidenceV2_1,
  CompatibilityViolation,
  EvidenceLines,
  HumanIntentState,
  LedgerEntry,
  SnapshotFinding,
} from './schema';

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
  }));
};

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTextList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const text = normalizeText(item);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    result.push(text);
  }
  return result;
};

const normalizeDateIso = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }
  const date = Date.parse(normalized);
  if (!Number.isFinite(date)) {
    return null;
  }
  return new Date(date).toISOString();
};

const normalizeHumanIntent = (value: HumanIntentState | null): HumanIntentState | null => {
  if (!value) {
    return null;
  }

  const confidence =
    value.confidence_level === 'high' ||
    value.confidence_level === 'medium' ||
    value.confidence_level === 'low' ||
    value.confidence_level === 'unset'
      ? value.confidence_level
      : 'unset';
  const preservedAt = normalizeDateIso(value.preserved_at);
  if (!preservedAt) {
    return null;
  }
  const hint = normalizeText(value._hint);

  return {
    primary_goal: normalizeText(value.primary_goal),
    secondary_goals: normalizeTextList(value.secondary_goals),
    non_goals: normalizeTextList(value.non_goals),
    constraints: normalizeTextList(value.constraints),
    confidence_level: confidence,
    set_by: normalizeText(value.set_by),
    set_at: normalizeDateIso(value.set_at),
    expires_at: normalizeDateIso(value.expires_at),
    preserved_at: preservedAt,
    preservation_count:
      Number.isFinite(value.preservation_count) && value.preservation_count >= 0
        ? Math.trunc(value.preservation_count)
        : 0,
    ...(hint ? { _hint: hint } : {}),
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

  return {
    version: '2.1',
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
      findings: normalizedFindings,
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
  };
};

const resolveRepoRoot = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return process.cwd();
  }
};

export function writeEvidence(evidence: AiEvidenceV2_1): WriteEvidenceResult {
  const repoRoot = resolveRepoRoot();
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
