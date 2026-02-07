import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Fact } from '../../core/facts/Fact';
import { extractHeuristicFacts } from '../../core/facts/extractHeuristicFacts';
import type { FileChangeFact } from '../../core/facts/FileChangeFact';
import type { FileContentFact } from '../../core/facts/FileContentFact';
import type { Finding } from '../../core/gate/Finding';
import { evaluateGate } from '../../core/gate/evaluateGate';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import { evaluateRules } from '../../core/gate/evaluateRules';
import type { RuleSet } from '../../core/rules/RuleSet';
import { mergeRuleSets } from '../../core/rules/mergeRuleSets';
import { androidRuleSet } from '../../core/rules/presets/androidRuleSet';
import { astHeuristicsRuleSet } from '../../core/rules/presets/astHeuristicsRuleSet';
import { backendRuleSet } from '../../core/rules/presets/backendRuleSet';
import { frontendRuleSet } from '../../core/rules/presets/frontendRuleSet';
import { iosEnterpriseRuleSet } from '../../core/rules/presets/iosEnterpriseRuleSet';
import { rulePackVersions } from '../../core/rules/presets/rulePackVersions';
import { loadHeuristicsConfig } from '../config/heuristics';
import { loadProjectRules } from '../config/loadProjectRules';
import { generateEvidence } from '../evidence/generateEvidence';
import type { AiEvidenceV2_1, PlatformState, RulesetState } from '../evidence/schema';
import { applyHeuristicSeverityForStage } from '../gate/stagePolicies';
import { detectPlatformsFromFacts } from '../platform/detectPlatforms';
import { getFactsForCommitRange } from './getCommitRangeFacts';

type ChangeFact = FileChangeFact & { source: string };
type ContentFact = FileContentFact & { source: string };

type GateScope =
  | {
      kind: 'staged';
      extensions?: string[];
    }
  | {
      kind: 'range';
      fromRef: string;
      toRef: string;
      extensions?: string[];
    };

type StagedChange = {
  path: string;
  changeType: 'added' | 'modified' | 'deleted';
};

const EVIDENCE_FILE_NAME = '.ai_evidence.json';
const DEFAULT_EXTENSIONS = ['.swift', '.ts', '.tsx', '.js', '.jsx', '.kt', '.kts'];
const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' });
};

const formatFinding = (finding: Finding): string => {
  return `${finding.ruleId}: ${finding.message}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isAiEvidenceV2_1 = (value: unknown): value is AiEvidenceV2_1 => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.version === '2.1' &&
    'snapshot' in value &&
    isRecord(value.snapshot) &&
    Array.isArray(value.ledger)
  );
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

const parseNameStatus = (output: string): StagedChange[] => {
  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  const changes: StagedChange[] = [];
  for (const line of trimmed.split('\n')) {
    if (!line) {
      continue;
    }
    const parts = line.split('\t');
    const status = parts[0];
    const statusCode = status[0];
    const path = statusCode === 'R' || statusCode === 'C' ? parts[2] : parts[1];
    if (!path) {
      continue;
    }

    const changeType =
      statusCode === 'A'
        ? 'added'
        : statusCode === 'M'
          ? 'modified'
          : statusCode === 'D'
            ? 'deleted'
            : statusCode === 'R' || statusCode === 'C'
              ? 'modified'
              : null;
    if (!changeType) {
      continue;
    }

    changes.push({ path, changeType });
  }

  return changes;
};

const hasAllowedExtension = (
  path: string,
  extensions: ReadonlyArray<string>
): boolean => {
  return extensions.some((extension) => path.endsWith(extension));
};

const getStagedFacts = (extensions: ReadonlyArray<string>): ReadonlyArray<Fact> => {
  const nameStatus = runGit(['diff', '--cached', '--name-status']);
  const changes = parseNameStatus(nameStatus).filter((change) =>
    hasAllowedExtension(change.path, extensions)
  );

  const facts: Fact[] = [];
  const source = 'git:staged';

  for (const change of changes) {
    const changeFact: ChangeFact = {
      kind: 'FileChange',
      path: change.path,
      changeType: change.changeType,
      source,
    };
    facts.push(changeFact);

    if (change.changeType === 'deleted') {
      continue;
    }

    const content = runGit(['show', `:${change.path}`]);
    const contentFact: ContentFact = {
      kind: 'FileContent',
      path: change.path,
      content,
      source,
    };
    facts.push(contentFact);
  }

  return facts;
};

const resolveRepoRoot = (): string => {
  try {
    return runGit(['rev-parse', '--show-toplevel']).trim();
  } catch {
    return process.cwd();
  }
};

const loadPreviousEvidence = (repoRoot: string): AiEvidenceV2_1 | undefined => {
  try {
    const evidencePath = join(repoRoot, EVIDENCE_FILE_NAME);
    if (!existsSync(evidencePath)) {
      return undefined;
    }
    const raw: unknown = JSON.parse(readFileSync(evidencePath, 'utf8'));
    if (!isAiEvidenceV2_1(raw)) {
      return undefined;
    }
    return raw;
  } catch {
    return undefined;
  }
};

const resolveRulesetFile = (
  fileName: 'rulesgold.mdc' | 'rulesbackend.mdc'
): string | undefined => {
  const candidates = [
    join(process.cwd(), 'legacy', 'tooling', '.cursor', 'rules', fileName),
    join(process.cwd(), 'legacy', 'tooling', '.windsurf', 'rules', fileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const hashRulesetFile = (filePath: string | undefined): string => {
  if (!filePath) {
    return 'missing';
  }
  return createHash('sha256').update(readFileSync(filePath, 'utf8')).digest('hex');
};

const toDetectedPlatformsRecord = (
  detected: ReturnType<typeof detectPlatformsFromFacts>
): Record<string, PlatformState> => {
  const result: Record<string, PlatformState> = {};
  for (const [platform, state] of Object.entries(detected)) {
    if (!state) {
      continue;
    }
    result[platform] = state;
  }
  return result;
};

const buildCombinedBaselineRules = (
  detected: ReturnType<typeof detectPlatformsFromFacts>
): RuleSet => {
  const rules: RuleSet[number][] = [];
  if (detected.ios) {
    rules.push(...iosEnterpriseRuleSet);
  }
  if (detected.backend) {
    rules.push(...backendRuleSet);
  }
  if (detected.frontend) {
    rules.push(...frontendRuleSet);
  }
  if (detected.android) {
    rules.push(...androidRuleSet);
  }
  return rules;
};

const buildRulesetState = (params: {
  detected: ReturnType<typeof detectPlatformsFromFacts>;
  projectRules: RuleSet;
  heuristicRules: RuleSet;
  stage: GatePolicy['stage'];
}): RulesetState[] => {
  const states: RulesetState[] = [];

  if (params.detected.ios) {
    states.push({
      platform: 'ios',
      bundle: `iosEnterpriseRuleSet@${rulePackVersions.iosEnterpriseRuleSet}`,
      hash: createHash('sha256')
        .update(stableStringify(iosEnterpriseRuleSet))
        .digest('hex'),
    });
  }

  if (params.detected.backend) {
    states.push({
      platform: 'backend',
      bundle: `backendRuleSet@${rulePackVersions.backendRuleSet}`,
      hash: createHash('sha256').update(stableStringify(backendRuleSet)).digest('hex'),
    });

    const goldRulesetFile = resolveRulesetFile('rulesgold.mdc');
    const backendRulesetFile = resolveRulesetFile('rulesbackend.mdc');
    states.push({
      platform: 'gold',
      bundle: `rulesgold.mdc@${rulePackVersions.rulesgold}`,
      hash: hashRulesetFile(goldRulesetFile),
    });
    states.push({
      platform: 'backend',
      bundle: `rulesbackend.mdc@${rulePackVersions.rulesbackend}`,
      hash: hashRulesetFile(backendRulesetFile),
    });
  }

  if (params.detected.frontend) {
    states.push({
      platform: 'frontend',
      bundle: `frontendRuleSet@${rulePackVersions.frontendRuleSet}`,
      hash: createHash('sha256').update(stableStringify(frontendRuleSet)).digest('hex'),
    });
  }

  if (params.detected.android) {
    states.push({
      platform: 'android',
      bundle: `androidRuleSet@${rulePackVersions.androidRuleSet}`,
      hash: createHash('sha256').update(stableStringify(androidRuleSet)).digest('hex'),
    });
  }

  if (params.projectRules.length > 0) {
    states.push({
      platform: 'project',
      bundle: 'project-rules',
      hash: createHash('sha256')
        .update(stableStringify(params.projectRules))
        .digest('hex'),
    });
  }

  if (params.heuristicRules.length > 0) {
    states.push({
      platform: 'heuristics',
      bundle: `astHeuristicsRuleSet@${rulePackVersions.astHeuristicsRuleSet}`,
      hash: createHash('sha256')
        .update(`stage:${params.stage}`)
        .update(stableStringify(params.heuristicRules))
        .digest('hex'),
    });
  }

  return states;
};

export async function runPlatformGate(params: {
  policy: GatePolicy;
  scope: GateScope;
}): Promise<number> {
  const extensions = params.scope.extensions ?? DEFAULT_EXTENSIONS;
  const facts =
    params.scope.kind === 'staged'
      ? getStagedFacts(extensions)
      : await getFactsForCommitRange({
          fromRef: params.scope.fromRef,
          toRef: params.scope.toRef,
          extensions,
        });

  const detectedPlatforms = detectPlatformsFromFacts(facts);
  const heuristicsConfig = loadHeuristicsConfig();
  const baselineRules = buildCombinedBaselineRules(detectedPlatforms);
  const heuristicFacts = heuristicsConfig.astSemanticEnabled
    ? extractHeuristicFacts({
        facts,
        detectedPlatforms,
      })
    : [];
  const evaluationFacts: ReadonlyArray<Fact> =
    heuristicFacts.length > 0 ? [...facts, ...heuristicFacts] : facts;
  const heuristicRules = heuristicsConfig.astSemanticEnabled
    ? applyHeuristicSeverityForStage(astHeuristicsRuleSet, params.policy.stage)
    : [];
  const baselineRulesWithHeuristics: RuleSet = [...baselineRules, ...heuristicRules];
  const projectConfig = loadProjectRules();
  const projectRules = projectConfig?.rules ?? [];
  const mergedRules = mergeRuleSets(baselineRulesWithHeuristics, projectRules, {
    allowDowngradeBaseline: projectConfig?.allowOverrideLocked === true,
  });
  const findings = evaluateRules(mergedRules, evaluationFacts);
  const decision = evaluateGate([...findings], params.policy);

  generateEvidence({
    stage: params.policy.stage,
    findings,
    gateOutcome: decision.outcome,
    previousEvidence: loadPreviousEvidence(resolveRepoRoot()),
    detectedPlatforms: toDetectedPlatformsRecord(detectedPlatforms),
    loadedRulesets: buildRulesetState({
      detected: detectedPlatforms,
      projectRules,
      heuristicRules,
      stage: params.policy.stage,
    }),
  });

  if (decision.outcome === 'BLOCK') {
    for (const finding of findings) {
      console.log(formatFinding(finding));
    }
    return 1;
  }

  return 0;
}
