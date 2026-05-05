import type { RuleSet } from '../rules/RuleSet';
import type { RuleDefinition } from '../rules/RuleDefinition';
import type { Condition } from '../rules/Condition';
import type { Consequence } from '../rules/Consequence';
import type { Fact } from '../facts/Fact';
import type { FileChangeFact } from '../facts/FileChangeFact';
import type { FileContentFact } from '../facts/FileContentFact';
import type { Finding } from './Finding';
import { conditionMatches } from './conditionMatches';
import { matchesScope } from './scopeMatcher';

type FactInput = Fact | FileChangeFact | FileContentFact;

type FindingTarget = {
  filePath?: string;
  lines?: Finding['lines'];
  matchedBy?: string;
  source?: string;
  primary_node?: Finding['primary_node'];
  related_nodes?: Finding['related_nodes'];
  why?: string;
  impact?: string;
  expected_fix?: string;
};

const isBlockingSeverity = (_severity: RuleDefinition['severity']): boolean => true;

export type EvaluateRulesCoverageResult = {
  findings: ReadonlyArray<Finding>;
  evaluatedRuleIds: ReadonlyArray<string>;
};

const toFinding = (
  rule: RuleDefinition,
  consequence: Consequence,
  target?: FindingTarget
): Finding => {
  const sourceParts = [
    target?.source?.trim(),
    consequence.source?.trim(),
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);
  const mergedSource = sourceParts.length > 0 ? sourceParts.join('|') : undefined;

  return {
    ruleId: rule.id,
    severity: rule.severity,
    code: consequence.code ?? rule.id,
    message: consequence.message,
    filePath: target?.filePath,
    lines: target?.lines,
    matchedBy: target?.matchedBy,
    source: mergedSource,
    blocking: isBlockingSeverity(rule.severity),
    primary_node: target?.primary_node,
    related_nodes: target?.related_nodes,
    why: target?.why,
    impact: target?.impact,
    expected_fix: target?.expected_fix,
  };
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
        lines: fact.lines,
        matchedBy: 'Heuristic',
        source: fact.source,
        primary_node: fact.primary_node,
        related_nodes: fact.related_nodes,
        why: fact.why,
        impact: fact.impact,
        expected_fix: fact.expected_fix,
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
