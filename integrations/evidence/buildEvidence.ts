import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import type { Severity } from '../../core/rules/Severity';
import type {
  AiEvidenceV2_1,
  CompatibilityViolation,
  EvidenceLines,
  HumanIntentConfidence,
  HumanIntentState,
  LedgerEntry,
  PlatformState,
  RulesetState,
  SnapshotFinding,
} from './schema';

type BuildFindingInput = Finding & {
  file?: string;
  lines?: EvidenceLines;
};

export type BuildEvidenceParams = {
  stage: GateStage;
  findings: ReadonlyArray<BuildFindingInput>;
  previousEvidence?: AiEvidenceV2_1;
  humanIntent?: HumanIntentState | null;
  detectedPlatforms: Record<string, PlatformState>;
  loadedRulesets: ReadonlyArray<RulesetState>;
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

const normalizeConfidence = (value: unknown): HumanIntentConfidence => {
  if (value === 'high' || value === 'medium' || value === 'low' || value === 'unset') {
    return value;
  }
  return 'unset';
};

const normalizeHumanIntent = (input: HumanIntentState | null | undefined): HumanIntentState | null => {
  if (!input) {
    return null;
  }

  const preservedAt = normalizeDateIso(input.preserved_at);
  if (!preservedAt) {
    return null;
  }

  const hint = normalizeText(input._hint);

  return {
    primary_goal: normalizeText(input.primary_goal),
    secondary_goals: normalizeTextList(input.secondary_goals),
    non_goals: normalizeTextList(input.non_goals),
    constraints: normalizeTextList(input.constraints),
    confidence_level: normalizeConfidence(input.confidence_level),
    set_by: normalizeText(input.set_by),
    set_at: normalizeDateIso(input.set_at),
    expires_at: normalizeDateIso(input.expires_at),
    preserved_at: preservedAt,
    preservation_count:
      Number.isFinite(input.preservation_count) && input.preservation_count >= 0
        ? Math.trunc(input.preservation_count)
        : 0,
    ...(hint ? { _hint: hint } : {}),
  };
};

const isExpiredHumanIntent = (intent: HumanIntentState, now: string): boolean => {
  if (!intent.expires_at) {
    return false;
  }

  const expiresAt = Date.parse(intent.expires_at);
  const nowTime = Date.parse(now);
  if (!Number.isFinite(expiresAt) || !Number.isFinite(nowTime)) {
    return true;
  }
  return expiresAt <= nowTime;
};

const resolveHumanIntent = (params: {
  now: string;
  inputIntent?: HumanIntentState | null;
  previousEvidence?: AiEvidenceV2_1;
}): HumanIntentState | null => {
  const candidate = normalizeHumanIntent(
    params.inputIntent ?? params.previousEvidence?.human_intent ?? null
  );
  if (!candidate || isExpiredHumanIntent(candidate, params.now)) {
    return null;
  }

  const isExplicitInput = typeof params.inputIntent !== 'undefined';
  const nextCount = isExplicitInput
    ? candidate.preservation_count
    : candidate.preservation_count + 1;

  return {
    ...candidate,
    preserved_at: params.now,
    preservation_count: nextCount,
  };
};

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

const normalizeFinding = (finding: BuildFindingInput): SnapshotFinding => {
  const file = (finding.filePath ?? finding.file ?? 'unknown').replace(/\\/g, '/');
  return {
    ruleId: finding.ruleId,
    severity: finding.severity,
    code: finding.code,
    message: finding.message,
    file,
    lines: normalizeLines(finding.lines),
  };
};

const dedupeFindings = (
  findings: ReadonlyArray<BuildFindingInput>
): SnapshotFinding[] => {
  const unique = new Map<string, SnapshotFinding>();
  for (const finding of findings) {
    const normalized = normalizeFinding(finding);
    const key = findingKey(normalized);
    if (!unique.has(key)) {
      unique.set(key, normalized);
    }
  }
  return Array.from(unique.values()).sort((left, right) =>
    findingKey(left).localeCompare(findingKey(right))
  );
};

const toGateOutcome = (findings: ReadonlyArray<SnapshotFinding>): GateOutcome => {
  if (findings.some((finding) => finding.severity === 'CRITICAL')) {
    return 'BLOCK';
  }
  return findings.length > 0 ? 'WARN' : 'PASS';
};

const bySeverity = (findings: ReadonlyArray<SnapshotFinding>): Record<Severity, number> => {
  const counts: Record<Severity, number> = {
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    CRITICAL: 0,
  };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }
  return counts;
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

const updateLedger = (params: {
  findings: ReadonlyArray<SnapshotFinding>;
  previousEvidence?: AiEvidenceV2_1;
  now: string;
}): LedgerEntry[] => {
  const previous = new Map<string, LedgerEntry>();
  for (const entry of params.previousEvidence?.ledger ?? []) {
    previous.set(ledgerKey(entry), entry);
  }

  const activeLedger = params.findings.map<LedgerEntry>((finding) => {
    const key = findingKey(finding);
    const prior = previous.get(key);
    return {
      ruleId: finding.ruleId,
      file: finding.file,
      lines: finding.lines,
      firstSeen: prior?.firstSeen ?? params.now,
      lastSeen: params.now,
    };
  });

  return activeLedger.sort((left, right) => ledgerKey(left).localeCompare(ledgerKey(right)));
};

const normalizePlatforms = (
  platforms: Record<string, PlatformState>
): Record<string, PlatformState> => {
  const ordered: Record<string, PlatformState> = {};
  for (const platform of Object.keys(platforms).sort()) {
    ordered[platform] = {
      detected: platforms[platform].detected,
      confidence: platforms[platform].confidence,
    };
  }
  return ordered;
};

const normalizeRulesets = (rulesets: ReadonlyArray<RulesetState>): RulesetState[] => {
  const unique = new Map<string, RulesetState>();
  for (const ruleset of rulesets) {
    const key = `${ruleset.platform}::${ruleset.bundle}`;
    if (!unique.has(key)) {
      unique.set(key, {
        platform: ruleset.platform,
        bundle: ruleset.bundle,
        hash: ruleset.hash,
      });
    }
  }

  return Array.from(unique.values()).sort((left, right) => {
    const byPlatform = left.platform.localeCompare(right.platform);
    return byPlatform !== 0 ? byPlatform : left.bundle.localeCompare(right.bundle);
  });
};

export function buildEvidence(params: BuildEvidenceParams): AiEvidenceV2_1 {
  const now = new Date().toISOString();
  const normalizedFindings = dedupeFindings(params.findings);
  const outcome = toGateOutcome(normalizedFindings);
  const gateStatus = outcome === 'BLOCK' ? 'BLOCKED' : 'ALLOWED';
  const severity = bySeverity(normalizedFindings);
  const humanIntent = resolveHumanIntent({
    now,
    inputIntent: params.humanIntent,
    previousEvidence: params.previousEvidence,
  });

  return {
    version: '2.1',
    timestamp: now,
    snapshot: {
      stage: params.stage,
      outcome,
      findings: normalizedFindings,
    },
    ledger: updateLedger({
      findings: normalizedFindings,
      previousEvidence: params.previousEvidence,
      now,
    }),
    platforms: normalizePlatforms(params.detectedPlatforms),
    rulesets: normalizeRulesets(params.loadedRulesets),
    human_intent: humanIntent,
    ai_gate: {
      status: gateStatus,
      violations: toCompatibilityViolations(normalizedFindings),
      human_intent: humanIntent,
    },
    severity_metrics: {
      gate_status: gateStatus,
      total_violations: normalizedFindings.length,
      by_severity: severity,
    },
  };
}
