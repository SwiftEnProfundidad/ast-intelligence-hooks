import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type {
  AiEvidenceV2_1,
  CompatibilityViolation,
  EvidenceLines,
  LedgerEntry,
  SnapshotFinding,
} from './schema';
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
