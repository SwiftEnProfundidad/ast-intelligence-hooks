import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import type { RuleSet } from '../../core/rules/RuleSet';

export type AstIntelligenceDualValidationMode = 'off' | 'shadow' | 'strict';

export type AstIntelligenceDualValidationSummary = {
  mapped_rules: number;
  compared_rules: number;
  legacy_triggered: number;
  ast_triggered: number;
  divergences: number;
  false_positives: number;
  false_negatives: number;
  latency_ms: number;
  languages: ReadonlyArray<string>;
  sample_divergence_rule_ids: ReadonlyArray<string>;
};

export type AstIntelligenceDualValidationResult = {
  mode: AstIntelligenceDualValidationMode;
  summary: AstIntelligenceDualValidationSummary;
  finding?: Finding;
};

type ComparableMappedRule = {
  ruleId: string;
  astNodeRuleIds: ReadonlyArray<string>;
};

const AST_INTELLIGENCE_DUAL_MODE_ENV = 'PUMUKI_AST_INTELLIGENCE_DUAL_MODE';
const SKILLS_IR_PREFIX = 'skills-ir:';
const AST_NODES_TOKEN_PATTERN = /(?:^|;)ast_nodes=\[([^\]]*)\]/;

const EMPTY_SUMMARY: AstIntelligenceDualValidationSummary = {
  mapped_rules: 0,
  compared_rules: 0,
  legacy_triggered: 0,
  ast_triggered: 0,
  divergences: 0,
  false_positives: 0,
  false_negatives: 0,
  latency_ms: 0,
  languages: [],
  sample_divergence_rule_ids: [],
};

const isString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toNormalizedPath = (path: string): string => path.replace(/\\/g, '/').trim();

const toLanguageTokenFromPath = (path: string): string | null => {
  const normalized = toNormalizedPath(path).toLowerCase();
  if (
    normalized.endsWith('.ts')
    || normalized.endsWith('.tsx')
    || normalized.endsWith('.js')
    || normalized.endsWith('.jsx')
    || normalized.endsWith('.mts')
    || normalized.endsWith('.cts')
    || normalized.endsWith('.mjs')
    || normalized.endsWith('.cjs')
  ) {
    return 'typescript';
  }
  if (normalized.endsWith('.swift')) {
    return 'swift';
  }
  if (normalized.endsWith('.kt') || normalized.endsWith('.kts')) {
    return 'kotlin';
  }
  return null;
};

const detectLanguagesFromFacts = (facts: ReadonlyArray<Fact>): ReadonlyArray<string> => {
  const languages = new Set<string>();
  for (const fact of facts) {
    if (fact.kind !== 'FileChange' && fact.kind !== 'FileContent' && fact.kind !== 'Heuristic') {
      continue;
    }
    const rawPath = fact.kind === 'Heuristic' ? fact.filePath : fact.path;
    if (!isString(rawPath)) {
      continue;
    }
    const language = toLanguageTokenFromPath(rawPath);
    if (language) {
      languages.add(language);
    }
  }
  return [...languages].sort();
};

const parseAstNodesFromSource = (source: string | undefined): ReadonlyArray<string> => {
  if (!isString(source) || !source.startsWith(SKILLS_IR_PREFIX)) {
    return [];
  }
  const match = source.match(AST_NODES_TOKEN_PATTERN);
  if (!match || !isString(match[1])) {
    return [];
  }
  const astNodeRuleIds = match[1]
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && token !== 'none');
  return [...new Set(astNodeRuleIds)].sort();
};

const collectComparableMappedRules = (
  skillsRules: RuleSet
): ReadonlyArray<ComparableMappedRule> => {
  return skillsRules
    .filter(
      (rule) =>
        rule.id.startsWith('skills.')
        && rule.then.kind === 'Finding'
        && parseAstNodesFromSource(rule.then.source).length > 0
    )
    .map((rule) => ({
      ruleId: rule.id,
      astNodeRuleIds: parseAstNodesFromSource(rule.then.source),
    }))
    .sort((left, right) => left.ruleId.localeCompare(right.ruleId));
};

const collectHeuristicRuleIds = (facts: ReadonlyArray<Fact>): ReadonlySet<string> => {
  const heuristicRuleIds = new Set<string>();
  for (const fact of facts) {
    if (fact.kind === 'Heuristic' && isString(fact.ruleId)) {
      heuristicRuleIds.add(fact.ruleId.trim());
    }
  }
  return heuristicRuleIds;
};

const collectLegacyTriggeredRuleIds = (
  legacyFindings: ReadonlyArray<Finding>
): ReadonlySet<string> => {
  const legacyRuleIds = new Set<string>();
  for (const finding of legacyFindings) {
    if (isString(finding.ruleId)) {
      legacyRuleIds.add(finding.ruleId.trim());
    }
  }
  return legacyRuleIds;
};

export const resolveAstIntelligenceDualValidationMode = (
  explicitMode?: string
): AstIntelligenceDualValidationMode => {
  const raw = (explicitMode ?? process.env[AST_INTELLIGENCE_DUAL_MODE_ENV] ?? 'off')
    .trim()
    .toLowerCase();
  if (raw === 'strict' || raw === 'enforce' || raw === 'block') {
    return 'strict';
  }
  if (raw === 'shadow' || raw === 'dual' || raw === '1' || raw === 'true' || raw === 'on') {
    return 'shadow';
  }
  return 'off';
};

const toDualValidationFinding = (params: {
  mode: Exclude<AstIntelligenceDualValidationMode, 'off'>;
  stage: 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  summary: AstIntelligenceDualValidationSummary;
}): Finding | undefined => {
  if (params.summary.divergences === 0) {
    return undefined;
  }
  const sampleRuleIds = params.summary.sample_divergence_rule_ids.join(', ');
  if (params.mode === 'strict') {
    return {
      ruleId: 'governance.ast-intelligence.dual-validation.mismatch',
      severity: 'ERROR',
      code: 'AST_INTELLIGENCE_DUAL_VALIDATION_MISMATCH_HIGH',
      message:
        `AST Intelligence dual validation mismatch at ${params.stage}: ` +
        `divergences=${params.summary.divergences} ` +
        `false_positives=${params.summary.false_positives} ` +
        `false_negatives=${params.summary.false_negatives} ` +
        `sample_rule_ids=[${sampleRuleIds}].`,
      filePath: '.ai_evidence.json',
      matchedBy: 'AstIntelligenceDualValidationGuard',
      source: 'ast-intelligence-dual-mode',
    };
  }
  return {
    ruleId: 'governance.ast-intelligence.dual-validation.shadow',
    severity: 'INFO',
    code: 'AST_INTELLIGENCE_DUAL_VALIDATION_SHADOW',
    message:
      `AST Intelligence dual validation shadow at ${params.stage}: ` +
      `divergences=${params.summary.divergences} ` +
      `false_positives=${params.summary.false_positives} ` +
      `false_negatives=${params.summary.false_negatives} ` +
      `sample_rule_ids=[${sampleRuleIds}].`,
    filePath: '.ai_evidence.json',
    matchedBy: 'AstIntelligenceDualValidationGuard',
    source: 'ast-intelligence-dual-mode',
  };
};

export const evaluateAstIntelligenceDualValidation = (params: {
  stage: 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  skillsRules: RuleSet;
  facts: ReadonlyArray<Fact>;
  legacyFindings: ReadonlyArray<Finding>;
  mode?: string;
}): AstIntelligenceDualValidationResult => {
  const mode = resolveAstIntelligenceDualValidationMode(params.mode);
  if (mode === 'off') {
    return {
      mode,
      summary: EMPTY_SUMMARY,
    };
  }
  const startedAt = Date.now();
  const comparableMappedRules = collectComparableMappedRules(params.skillsRules);
  const heuristicRuleIds = collectHeuristicRuleIds(params.facts);
  const legacyTriggeredRuleIds = collectLegacyTriggeredRuleIds(params.legacyFindings);
  const languages = detectLanguagesFromFacts(params.facts);

  let legacyTriggered = 0;
  let astTriggered = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  const divergenceRuleIds: string[] = [];

  for (const mappedRule of comparableMappedRules) {
    const isLegacyTriggered = legacyTriggeredRuleIds.has(mappedRule.ruleId);
    const isAstTriggered = mappedRule.astNodeRuleIds.some((astNodeRuleId) =>
      heuristicRuleIds.has(astNodeRuleId)
    );

    if (isLegacyTriggered) {
      legacyTriggered += 1;
    }
    if (isAstTriggered) {
      astTriggered += 1;
    }
    if (isLegacyTriggered === isAstTriggered) {
      continue;
    }
    if (isAstTriggered) {
      falsePositives += 1;
    } else {
      falseNegatives += 1;
    }
    divergenceRuleIds.push(mappedRule.ruleId);
  }

  const summary: AstIntelligenceDualValidationSummary = {
    mapped_rules: comparableMappedRules.length,
    compared_rules: comparableMappedRules.length,
    legacy_triggered: legacyTriggered,
    ast_triggered: astTriggered,
    divergences: divergenceRuleIds.length,
    false_positives: falsePositives,
    false_negatives: falseNegatives,
    latency_ms: Math.max(0, Date.now() - startedAt),
    languages,
    sample_divergence_rule_ids: divergenceRuleIds.slice(0, 5),
  };

  return {
    mode,
    summary,
    finding: toDualValidationFinding({
      mode,
      stage: params.stage,
      summary,
    }),
  };
};
