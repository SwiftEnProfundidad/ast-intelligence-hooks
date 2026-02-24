import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import type { Severity } from '../../core/rules/Severity';
import type {
  AiEvidenceV2_1,
  ConsolidationSuppressedFinding,
  CompatibilityViolation,
  EvidenceLines,
  HumanIntentState,
  LedgerEntry,
  PlatformState,
  RepoState,
  RulesetState,
  SnapshotEvaluationMetrics,
  SnapshotRulesCoverage,
  SddMetrics,
  SnapshotFinding,
} from './schema';
import { buildSnapshotPlatformSummaries } from './platformSummary';
import { resolveHumanIntent } from './humanIntent';
import { normalizeSnapshotEvaluationMetrics } from './evaluationMetrics';
import { normalizeSnapshotRulesCoverage } from './rulesCoverage';

type BuildFindingInput = Finding & {
  file?: string;
  lines?: EvidenceLines;
};

export type BuildEvidenceParams = {
  stage: GateStage;
  auditMode?: 'gate' | 'engine';
  findings: ReadonlyArray<BuildFindingInput>;
  gateOutcome?: GateOutcome;
  filesScanned?: number;
  previousEvidence?: AiEvidenceV2_1;
  humanIntent?: HumanIntentState | null;
  detectedPlatforms: Record<string, PlatformState>;
  loadedRulesets: ReadonlyArray<RulesetState>;
  evaluationMetrics?: SnapshotEvaluationMetrics;
  rulesCoverage?: SnapshotRulesCoverage;
  sddMetrics?: SddMetrics;
  repoState?: RepoState;
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

const compareFindingEntries = (
  left: Pick<SnapshotFinding, 'ruleId' | 'file' | 'lines'>,
  right: Pick<SnapshotFinding, 'ruleId' | 'file' | 'lines'>
): number => {
  return findingKey(left).localeCompare(findingKey(right), undefined, { numeric: true });
};

const ledgerKey = (entry: Pick<LedgerEntry, 'ruleId' | 'file' | 'lines'>): string => {
  return `${entry.ruleId}::${entry.file}::${linesKey(entry.lines)}`;
};

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeOptionalNonNegativeInt = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(0, Math.trunc(value));
};

const countFilesAffected = (findings: ReadonlyArray<SnapshotFinding>): number => {
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

const normalizeFinding = (finding: BuildFindingInput): SnapshotFinding => {
  const file = (finding.filePath ?? finding.file ?? 'unknown').replace(/\\/g, '/');
  return {
    ruleId: finding.ruleId,
    severity: finding.severity,
    code: finding.code,
    message: finding.message,
    file,
    lines: normalizeLines(finding.lines),
    matchedBy: normalizeOptionalString(finding.matchedBy),
    source: normalizeOptionalString(finding.source),
  };
};

const pickDeterministicDuplicateFinding = (
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

  const tuple = (finding: SnapshotFinding): string => {
    return [
      finding.code,
      finding.message,
      finding.matchedBy ?? '',
      finding.source ?? '',
    ].join('\u0000');
  };

  return tuple(candidate).localeCompare(tuple(current)) < 0 ? candidate : current;
};

const severityRank: Record<Severity, number> = {
  INFO: 0,
  WARN: 1,
  ERROR: 2,
  CRITICAL: 3,
};

type RuleOrigin = 'project-rules' | 'skills' | 'platform-preset' | 'heuristics';

const ruleOriginRank: Record<RuleOrigin, number> = {
  heuristics: 0,
  'platform-preset': 1,
  skills: 2,
  'project-rules': 3,
};

const inferRuleOrigin = (ruleId: string): RuleOrigin => {
  if (ruleId.startsWith('heuristics.')) {
    return 'heuristics';
  }
  if (ruleId.startsWith('skills.')) {
    return 'skills';
  }
  if (
    ruleId.startsWith('ios.') ||
    ruleId.startsWith('android.') ||
    ruleId.startsWith('backend.') ||
    ruleId.startsWith('frontend.')
  ) {
    return 'platform-preset';
  }
  return 'project-rules';
};

const equivalentRuleFamilies: ReadonlyArray<ReadonlyArray<string>> = [
  ['ios.no-force-unwrap', 'skills.ios.no-force-unwrap', 'heuristics.ios.force-unwrap.ast'],
  ['skills.ios.no-force-try', 'heuristics.ios.force-try.ast'],
  ['skills.ios.no-force-cast', 'heuristics.ios.force-cast.ast'],
  ['ios.no-anyview', 'skills.ios.no-anyview', 'heuristics.ios.anyview.ast'],
  [
    'ios.no-completion-handlers-outside-bridges',
    'skills.ios.no-callback-style-outside-bridges',
    'heuristics.ios.callback-style.ast',
  ],
  ['ios.no-gcd', 'skills.ios.no-dispatchqueue', 'heuristics.ios.dispatchqueue.ast'],
  ['ios.no-gcd', 'skills.ios.no-dispatchgroup', 'heuristics.ios.dispatchgroup.ast'],
  ['ios.no-gcd', 'skills.ios.no-dispatchsemaphore', 'heuristics.ios.dispatchsemaphore.ast'],
  ['ios.no-gcd', 'skills.ios.no-operation-queue', 'heuristics.ios.operation-queue.ast'],
  ['skills.ios.no-task-detached', 'heuristics.ios.task-detached.ast'],
  ['skills.ios.no-unchecked-sendable', 'heuristics.ios.unchecked-sendable.ast'],
  ['skills.ios.no-observable-object', 'heuristics.ios.observable-object.ast'],
  ['skills.ios.no-navigation-view', 'heuristics.ios.navigation-view.ast'],
  ['skills.ios.no-on-tap-gesture', 'heuristics.ios.on-tap-gesture.ast'],
  ['skills.ios.no-string-format', 'heuristics.ios.string-format.ast'],
  ['skills.ios.no-uiscreen-main-bounds', 'heuristics.ios.uiscreen-main-bounds.ast'],
  [
    'backend.no-console-log',
    'frontend.no-console-log',
    'skills.backend.no-console-log',
    'skills.frontend.no-console-log',
    'heuristics.ts.console-log.ast',
  ],
  [
    'backend.avoid-explicit-any',
    'skills.backend.avoid-explicit-any',
    'skills.frontend.avoid-explicit-any',
    'heuristics.ts.explicit-any.ast',
  ],
  [
    'backend.no-empty-catch',
    'skills.backend.no-empty-catch',
    'skills.frontend.no-empty-catch',
    'heuristics.ts.empty-catch.ast',
  ],
  [
    'android.no-thread-sleep',
    'skills.android.no-thread-sleep',
    'heuristics.android.thread-sleep.ast',
  ],
  [
    'android.no-global-scope',
    'skills.android.no-globalscope',
    'heuristics.android.globalscope.ast',
  ],
  [
    'skills.android.no-runblocking',
    'heuristics.android.run-blocking.ast',
  ],
];

const ruleFamilyIndex = new Map<string, number>();
equivalentRuleFamilies.forEach((family, familyIndex) => {
  family.forEach((ruleId) => {
    ruleFamilyIndex.set(ruleId, familyIndex);
  });
});

const semanticKeywordFamilies: ReadonlyArray<readonly [string, RegExp]> = [
  ['keyword:explicit-any', /(?:^|[._-])explicit(?:[._-])?any(?:$|[._-])/i],
  ['keyword:empty-catch', /(?:^|[._-])empty(?:[._-])?catch(?:$|[._-])/i],
  ['keyword:console-log', /(?:^|[._-])console(?:[._-])?log(?:$|[._-])/i],
  ['keyword:anyview', /(?:^|[._-])anyview(?:$|[._-])/i],
  ['keyword:force-unwrap', /(?:^|[._-])force(?:[._-])?unwrap(?:$|[._-])/i],
];

const normalizeAnchorLine = (lines?: EvidenceLines): number => {
  if (typeof lines === 'number' && Number.isFinite(lines)) {
    return Math.max(0, Math.trunc(lines));
  }
  if (typeof lines === 'string') {
    const match = lines.match(/-?\d+/);
    if (!match) {
      return 0;
    }
    const value = Number.parseInt(match[0], 10);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return 0;
  }
  const finite = lines.filter((line: number) => Number.isFinite(line)).map((line: number) => Math.trunc(line));
  if (finite.length === 0) {
    return 0;
  }
  return Math.max(0, Math.min(...finite));
};

const inferPlatformFromFinding = (finding: Pick<SnapshotFinding, 'file' | 'ruleId'>): string => {
  const file = finding.file.replace(/\\/g, '/').toLowerCase();
  if (file.startsWith('apps/ios/') || file.startsWith('ios/')) {
    return 'ios';
  }
  if (file.startsWith('apps/backend/')) {
    return 'backend';
  }
  if (file.startsWith('apps/web/') || file.startsWith('apps/frontend/')) {
    return 'frontend';
  }
  if (file.startsWith('apps/android/')) {
    return 'android';
  }
  if (finding.ruleId.startsWith('ios.') || finding.ruleId.startsWith('skills.ios.')) {
    return 'ios';
  }
  if (finding.ruleId.startsWith('backend.') || finding.ruleId.startsWith('skills.backend.')) {
    return 'backend';
  }
  if (finding.ruleId.startsWith('frontend.') || finding.ruleId.startsWith('skills.frontend.')) {
    return 'frontend';
  }
  if (finding.ruleId.startsWith('android.') || finding.ruleId.startsWith('skills.android.')) {
    return 'android';
  }
  return 'generic';
};

const toSemanticFamilyToken = (ruleId: string): string => {
  for (const [token, pattern] of semanticKeywordFamilies) {
    if (pattern.test(ruleId)) {
      return token;
    }
  }
  const familyIndex = ruleFamilyIndex.get(ruleId);
  if (typeof familyIndex === 'number') {
    return `family:${familyIndex}`;
  }
  return `rule:${ruleId}`;
};

const toSemanticCollision = (
  stage: GateStage,
  finding: SnapshotFinding
): { key: string; platform: string } => {
  const platform = inferPlatformFromFinding(finding);
  const anchorLine = normalizeAnchorLine(finding.lines);
  const semanticFamily = toSemanticFamilyToken(finding.ruleId);
  return {
    key: `${stage}::${platform}::${finding.file}::${anchorLine}::${semanticFamily}`,
    platform,
  };
};

const preferFindingForSemanticCollision = (
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

  const byOrigin =
    ruleOriginRank[inferRuleOrigin(candidate.ruleId)] -
    ruleOriginRank[inferRuleOrigin(current.ruleId)];
  if (byOrigin > 0) {
    return candidate;
  }
  if (byOrigin < 0) {
    return current;
  }

  const byRuleId = candidate.ruleId.localeCompare(current.ruleId);
  if (byRuleId < 0) {
    return candidate;
  }
  if (byRuleId > 0) {
    return current;
  }

  const tuple = (finding: SnapshotFinding): string => {
    return [
      finding.code,
      finding.message,
      finding.matchedBy ?? '',
      finding.source ?? '',
    ].join('\u0000');
  };
  return tuple(candidate).localeCompare(tuple(current)) < 0 ? candidate : current;
};

const consolidateEquivalentFindings = (
  stage: GateStage,
  findings: ReadonlyArray<SnapshotFinding>
): { findings: SnapshotFinding[]; suppressed: ConsolidationSuppressedFinding[] } => {
  const selectedByCollision = new Map<string, SnapshotFinding>();
  const platformByCollision = new Map<string, string>();
  for (const finding of findings) {
    const collision = toSemanticCollision(stage, finding);
    const current = selectedByCollision.get(collision.key);
    if (!current) {
      selectedByCollision.set(collision.key, finding);
      platformByCollision.set(collision.key, collision.platform);
      continue;
    }
    selectedByCollision.set(
      collision.key,
      preferFindingForSemanticCollision(current, finding)
    );
  }

  const suppressed: ConsolidationSuppressedFinding[] = [];

  const filtered = findings.filter((finding) => {
    const collision = toSemanticCollision(stage, finding);
    const selected = selectedByCollision.get(collision.key);
    if (!selected) {
      return true;
    }
    const keep = findingKey(selected) === findingKey(finding);
    if (!keep) {
      suppressed.push({
        ruleId: finding.ruleId,
        file: finding.file,
        lines: finding.lines,
        replacedByRuleId: selected.ruleId,
        replacementRuleId: selected.ruleId,
        platform: platformByCollision.get(collision.key),
        reason: 'semantic-family-precedence',
      });
    }
    return keep;
  });

  suppressed.sort((left, right) => {
    const byFile = left.file.localeCompare(right.file);
    if (byFile !== 0) {
      return byFile;
    }
    const byRule = left.ruleId.localeCompare(right.ruleId);
    if (byRule !== 0) {
      return byRule;
    }
    const byReplacement = left.replacedByRuleId.localeCompare(right.replacedByRuleId);
    if (byReplacement !== 0) {
      return byReplacement;
    }
    return (left.platform ?? '').localeCompare(right.platform ?? '');
  });

  return {
    findings: filtered,
    suppressed,
  };
};

const normalizeAndDedupeFindings = (
  stage: GateStage,
  findings: ReadonlyArray<BuildFindingInput>
): { findings: SnapshotFinding[]; suppressed: ConsolidationSuppressedFinding[] } => {
  const unique = new Map<string, SnapshotFinding>();
  for (const finding of findings) {
    const normalized = normalizeFinding(finding);
    const key = findingKey(normalized);
    const current = unique.get(key);
    unique.set(
      key,
      current ? pickDeterministicDuplicateFinding(current, normalized) : normalized
    );
  }
  const deduped = Array.from(unique.values()).sort(compareFindingEntries);
  const consolidated = consolidateEquivalentFindings(stage, deduped);
  return {
    findings: consolidated.findings.sort(compareFindingEntries),
    suppressed: consolidated.suppressed,
  };
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

const toEnterpriseBySeverity = (
  severity: Readonly<Record<Severity, number>>
): Record<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', number> => {
  return {
    CRITICAL: severity.CRITICAL,
    HIGH: severity.ERROR,
    MEDIUM: severity.WARN,
    LOW: severity.INFO,
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

const normalizeRepoState = (repoState?: RepoState): RepoState | undefined => {
  if (!repoState) {
    return undefined;
  }
  return {
    repo_root: repoState.repo_root,
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
          config_path: repoState.lifecycle.hard_mode.config_path,
        }
        : undefined,
    },
  };
};

export function buildEvidence(params: BuildEvidenceParams): AiEvidenceV2_1 {
  const now = new Date().toISOString();
  const consolidatedFindings = normalizeAndDedupeFindings(params.stage, params.findings);
  const normalizedFindings = consolidatedFindings.findings;
  const normalizedFilesScanned = normalizeOptionalNonNegativeInt(params.filesScanned) ?? 0;
  const normalizedFilesAffected = countFilesAffected(normalizedFindings);
  const normalizedEvaluationMetrics = normalizeSnapshotEvaluationMetrics(params.evaluationMetrics);
  const normalizedRulesCoverage = normalizeSnapshotRulesCoverage(params.stage, params.rulesCoverage);
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
      audit_mode: params.auditMode ?? 'gate',
      outcome,
      files_scanned: normalizedFilesScanned,
      files_affected: normalizedFilesAffected,
      evaluation_metrics: normalizedEvaluationMetrics,
      rules_coverage: normalizedRulesCoverage,
      findings: normalizedFindings,
      platforms: buildSnapshotPlatformSummaries(
        normalizedFindings.map((finding) => ({
          ruleId: finding.ruleId,
          severity: finding.severity,
          file: finding.file,
        }))
      ),
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
      by_enterprise_severity: toEnterpriseBySeverity(severity),
    },
    sdd_metrics: params.sddMetrics
      ? {
        enforced: params.sddMetrics.enforced,
        stage: params.sddMetrics.stage,
        decision: {
          allowed: params.sddMetrics.decision.allowed,
          code: params.sddMetrics.decision.code,
          message: params.sddMetrics.decision.message,
        },
      }
      : undefined,
    repo_state: normalizeRepoState(params.repoState),
    consolidation:
      consolidatedFindings.suppressed.length > 0
        ? { suppressed: consolidatedFindings.suppressed }
        : undefined,
  };
}
