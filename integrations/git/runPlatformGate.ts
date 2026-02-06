import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Fact } from '../../core/facts/Fact';
import type { FileChangeFact } from '../../core/facts/FileChangeFact';
import type { FileContentFact } from '../../core/facts/FileContentFact';
import type { Finding } from '../../core/gate/Finding';
import { evaluateGate } from '../../core/gate/evaluateGate';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import { evaluateRules } from '../../core/gate/evaluateRules';
import type { RuleSet } from '../../core/rules/RuleSet';
import { mergeRuleSets } from '../../core/rules/mergeRuleSets';
import { iosEnterpriseRuleSet } from '../../core/rules/presets/iosEnterpriseRuleSet';
import { loadProjectRules } from '../config/loadProjectRules';
import { buildEvidence } from '../evidence/buildEvidence';
import type { AiEvidenceV2_1, PlatformState, RulesetState } from '../evidence/schema';
import { writeEvidence } from '../evidence/writeEvidence';
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
const DEFAULT_EXTENSIONS = ['.swift', '.ts'];

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

const resolveOptionalRuleSet = (modulePath: string, exportName: string): RuleSet => {
  try {
    const loaded: unknown = require(modulePath);
    if (isRecord(loaded) && exportName in loaded) {
      const maybeRuleSet = loaded[exportName];
      if (Array.isArray(maybeRuleSet)) {
        return maybeRuleSet as RuleSet;
      }
    }
    return [];
  } catch {
    return [];
  }
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
    const backendRuleSet = resolveOptionalRuleSet(
      '../../core/rules/presets/backendRuleSet',
      'backendRuleSet'
    );
    rules.push(...backendRuleSet);
  }
  if (detected.frontend) {
    const frontendRuleSet = resolveOptionalRuleSet(
      '../../core/rules/presets/frontendRuleSet',
      'frontendRuleSet'
    );
    rules.push(...frontendRuleSet);
  }
  if (detected.android) {
    const androidRuleSet = resolveOptionalRuleSet(
      '../../core/rules/presets/androidRuleSet',
      'androidRuleSet'
    );
    rules.push(...androidRuleSet);
  }
  return rules;
};

const buildRulesetState = (params: {
  detected: ReturnType<typeof detectPlatformsFromFacts>;
  projectRules: RuleSet;
}): RulesetState[] => {
  const states: RulesetState[] = [];

  if (params.detected.ios) {
    states.push({
      platform: 'ios',
      bundle: 'iosEnterpriseRuleSet',
      hash: createHash('sha256')
        .update(stableStringify(iosEnterpriseRuleSet))
        .digest('hex'),
    });
  }

  if (params.detected.backend) {
    const goldRulesetFile = resolveRulesetFile('rulesgold.mdc');
    const backendRulesetFile = resolveRulesetFile('rulesbackend.mdc');
    states.push({
      platform: 'gold',
      bundle: 'rulesgold.mdc',
      hash: hashRulesetFile(goldRulesetFile),
    });
    states.push({
      platform: 'backend',
      bundle: 'rulesbackend.mdc',
      hash: hashRulesetFile(backendRulesetFile),
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
  const baselineRules = buildCombinedBaselineRules(detectedPlatforms);
  const projectConfig = loadProjectRules();
  const projectRules = projectConfig?.rules ?? [];
  const mergedRules = mergeRuleSets(baselineRules, projectRules, {
    allowDowngradeBaseline: projectConfig?.allowOverrideLocked === true,
  });
  const findings = evaluateRules(mergedRules, facts);
  const decision = evaluateGate([...findings], params.policy);

  const evidence = buildEvidence({
    stage: params.policy.stage,
    findings,
    previousEvidence: loadPreviousEvidence(resolveRepoRoot()),
    detectedPlatforms: toDetectedPlatformsRecord(detectedPlatforms),
    loadedRulesets: buildRulesetState({
      detected: detectedPlatforms,
      projectRules,
    }),
  });
  writeEvidence(evidence);

  if (decision.outcome === 'BLOCK') {
    for (const finding of findings) {
      console.log(formatFinding(finding));
    }
    return 1;
  }

  return 0;
}
