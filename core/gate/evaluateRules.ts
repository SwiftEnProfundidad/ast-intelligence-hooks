import type { RuleSet } from '../rules/RuleSet';
import type { RuleDefinition } from '../rules/RuleDefinition';
import type { Condition } from '../rules/Condition';
import type { Consequence } from '../rules/Consequence';
import type { Fact } from '../facts/Fact';
import type { FileChangeFact } from '../facts/FileChangeFact';
import type { FileContentFact } from '../facts/FileContentFact';
import type { Finding } from './Finding';
import { conditionMatches } from './conditionMatches';

type FactInput = Fact | FileChangeFact | FileContentFact;

type FindingTarget = {
  filePath?: string;
  matchedBy?: string;
  source?: string;
};

export type EvaluateRulesCoverageResult = {
  findings: ReadonlyArray<Finding>;
  evaluatedRuleIds: ReadonlyArray<string>;
};

const toFinding = (
  rule: RuleDefinition,
  consequence: Consequence,
  target?: FindingTarget
): Finding => {
  return {
    ruleId: rule.id,
    severity: rule.severity,
    code: consequence.code ?? rule.id,
    message: consequence.message,
    filePath: target?.filePath,
    matchedBy: target?.matchedBy,
    source: target?.source,
  };
};

const extractPrefix = (pattern: string): string => {
  const wildcardIndex = pattern.indexOf('*');
  return wildcardIndex === -1 ? pattern : pattern.slice(0, wildcardIndex);
};

const matchesAnyPrefix = (path: string, patterns: ReadonlyArray<string>): boolean => {
  return patterns.some((pattern) => path.startsWith(extractPrefix(pattern)));
};

const matchesScope = (
  path: string,
  scope?: RuleDefinition['scope']
): boolean => {
  const include = scope?.include;
  const exclude = scope?.exclude;
  if (exclude && exclude.length > 0 && matchesAnyPrefix(path, exclude)) {
    return false;
  }
  if (!include || include.length === 0) {
    return true;
  }
  return matchesAnyPrefix(path, include);
};

const collectSimpleFindingTargets = (
  condition: Condition,
  facts: ReadonlyArray<FactInput>,
  scope?: RuleDefinition['scope']
): FindingTarget[] | undefined => {
  if (condition.kind === 'FileChange') {
    return facts
      .filter((fact): fact is FileChangeFact => fact.kind === 'FileChange')
      .filter((fact) => {
        if (condition.where?.pathPrefix && !fact.path.startsWith(condition.where.pathPrefix)) {
          return false;
        }
        if (condition.where?.changeType && fact.changeType !== condition.where.changeType) {
          return false;
        }
        return true;
      })
      .map((fact) => ({
        filePath: fact.path,
        matchedBy: 'FileChange',
        source: 'source' in fact && typeof fact.source === 'string' ? fact.source : undefined,
      }));
  }

  if (condition.kind === 'FileContent') {
    return facts
      .filter((fact): fact is FileContentFact => fact.kind === 'FileContent')
      .filter((fact) => matchesScope(fact.path, scope))
      .filter((fact) => {
        if (
          condition.contains
          && condition.contains.length > 0
          && !condition.contains.every((token) => fact.content.includes(token))
        ) {
          return false;
        }
        if (condition.regex && condition.regex.length > 0) {
          const matchesAll = condition.regex.every((pattern) => new RegExp(pattern).test(fact.content));
          if (!matchesAll) {
            return false;
          }
        }
        return true;
      })
      .map((fact) => ({
        filePath: fact.path,
        matchedBy: 'FileContent',
        source: 'source' in fact && typeof fact.source === 'string' ? fact.source : undefined,
      }));
  }

  if (condition.kind === 'Dependency') {
    return facts
      .filter((fact): fact is Extract<Fact, { kind: 'Dependency' }> => fact.kind === 'Dependency')
      .filter((fact) => {
        if (condition.where?.from && fact.from !== condition.where.from) {
          return false;
        }
        if (condition.where?.to && fact.to !== condition.where.to) {
          return false;
        }
        return true;
      })
      .map((fact) => ({
        matchedBy: 'Dependency',
        source: fact.source,
      }));
  }

  if (condition.kind === 'Heuristic') {
    return facts
      .filter((fact): fact is Extract<Fact, { kind: 'Heuristic' }> => fact.kind === 'Heuristic')
      .filter((fact) => {
        if (condition.where?.ruleId && fact.ruleId !== condition.where.ruleId) {
          return false;
        }
        if (condition.where?.code && fact.code !== condition.where.code) {
          return false;
        }
        if (condition.where?.filePathPrefix) {
          const filePath = fact.filePath ?? '';
          if (!filePath.startsWith(condition.where.filePathPrefix)) {
            return false;
          }
        }
        return true;
      })
      .map((fact) => ({
        filePath: fact.filePath,
        matchedBy: 'Heuristic',
        source: fact.source,
      }));
  }

  return undefined;
};

const evaluateRulesInternal = (
  rules: RuleSet,
  facts: ReadonlyArray<FactInput>
): EvaluateRulesCoverageResult => {
  const findings: Finding[] = [];
  const evaluatedRuleIds: string[] = [];

  for (const rule of rules) {
    const condition: Condition = rule.when;
    const consequence: Consequence = rule.then;
    if (consequence.kind === 'Finding') {
      evaluatedRuleIds.push(rule.id);
      const simpleTargets = collectSimpleFindingTargets(condition, facts, rule.scope);
      if (simpleTargets) {
        if (simpleTargets.length === 0) {
          continue;
        }
        findings.push(...simpleTargets.map((target) => toFinding(rule, consequence, target)));
        continue;
      }
      if (!conditionMatches(condition, facts, rule.scope)) {
        continue;
      }
      findings.push(toFinding(rule, consequence));
    }
  }

  return {
    findings,
    evaluatedRuleIds: Array.from(new Set(evaluatedRuleIds)).sort(),
  };
};

export function evaluateRules(
  rules: RuleSet,
  facts: ReadonlyArray<FactInput>
): ReadonlyArray<Finding> {
  return evaluateRulesInternal(rules, facts).findings;
}

export function evaluateRulesWithCoverage(
  rules: RuleSet,
  facts: ReadonlyArray<FactInput>
): EvaluateRulesCoverageResult {
  return evaluateRulesInternal(rules, facts);
}
