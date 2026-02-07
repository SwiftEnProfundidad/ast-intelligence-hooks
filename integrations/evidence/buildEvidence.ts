import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import type { Severity } from '../../core/rules/Severity';
import type {
  AiEvidenceV2_1,
  CompatibilityViolation,
  EvidenceLines,
  HumanIntentState,
  LedgerEntry,
  PlatformState,
  RulesetState,
  SnapshotFinding,
} from './schema';
import { resolveHumanIntent } from './humanIntent';

type BuildFindingInput = Finding & {
  file?: string;
  lines?: EvidenceLines;
};

export type BuildEvidenceParams = {
  stage: GateStage;
  findings: ReadonlyArray<BuildFindingInput>;
  gateOutcome?: GateOutcome;
  previousEvidence?: AiEvidenceV2_1;
  humanIntent?: HumanIntentState | null;
  detectedPlatforms: Record<string, PlatformState>;
  loadedRulesets: ReadonlyArray<RulesetState>;
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

const severityRank: Record<Severity, number> = {
  INFO: 0,
  WARN: 1,
  ERROR: 2,
  CRITICAL: 3,
};

const equivalentRuleFamilies: ReadonlyArray<ReadonlyArray<string>> = [
  ['ios.no-force-unwrap', 'heuristics.ios.force-unwrap.ast'],
  ['ios.no-anyview', 'heuristics.ios.anyview.ast'],
  ['ios.no-completion-handlers-outside-bridges', 'heuristics.ios.callback-style.ast'],
  ['backend.no-console-log', 'frontend.no-console-log', 'heuristics.ts.console-log.ast'],
  ['backend.avoid-explicit-any', 'heuristics.ts.explicit-any.ast'],
  ['backend.no-empty-catch', 'heuristics.ts.empty-catch.ast'],
];

const ruleFamilyIndex = new Map<string, number>();
equivalentRuleFamilies.forEach((family, familyIndex) => {
  family.forEach((ruleId) => {
    ruleFamilyIndex.set(ruleId, familyIndex);
  });
});

const isHeuristicRuleId = (ruleId: string): boolean => {
  return ruleId.startsWith('heuristics.');
};

const preferFinding = (
  current: SnapshotFinding,
  candidate: SnapshotFinding
): SnapshotFinding => {
  const bySeverity = severityRank[candidate.severity] - severityRank[current.severity];
  if (bySeverity > 0) {
    return candidate;
  }
  if (bySeverity < 0) {
    return current;
  }

  const currentIsHeuristic = isHeuristicRuleId(current.ruleId);
  const candidateIsHeuristic = isHeuristicRuleId(candidate.ruleId);
  if (currentIsHeuristic !== candidateIsHeuristic) {
    return currentIsHeuristic ? candidate : current;
  }

  return candidate.ruleId.localeCompare(current.ruleId) < 0 ? candidate : current;
};

const consolidateEquivalentFindings = (
  findings: ReadonlyArray<SnapshotFinding>
): SnapshotFinding[] => {
  const selectedByFileFamily = new Map<string, SnapshotFinding>();
  for (const finding of findings) {
    const familyIndex = ruleFamilyIndex.get(finding.ruleId);
    if (typeof familyIndex === 'undefined') {
      continue;
    }
    const key = `${finding.file}::${familyIndex}`;
    const current = selectedByFileFamily.get(key);
    if (!current) {
      selectedByFileFamily.set(key, finding);
      continue;
    }
    selectedByFileFamily.set(key, preferFinding(current, finding));
  }

  return findings.filter((finding) => {
    const familyIndex = ruleFamilyIndex.get(finding.ruleId);
    if (typeof familyIndex === 'undefined') {
      return true;
    }
    const selected = selectedByFileFamily.get(`${finding.file}::${familyIndex}`);
    return selected?.ruleId === finding.ruleId && selected.file === finding.file;
  });
};

const normalizeAndDedupeFindings = (
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
  const deduped = Array.from(unique.values());
  const filtered = consolidateEquivalentFindings(deduped);
  return filtered.sort((left, right) => findingKey(left).localeCompare(findingKey(right)));
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
  const normalizedFindings = normalizeAndDedupeFindings(params.findings);
  const outcome = params.gateOutcome ?? toGateOutcome(normalizedFindings);
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
