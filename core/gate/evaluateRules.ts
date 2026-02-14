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

const toFinding = (rule: RuleDefinition, consequence: Consequence): Finding => {
  return {
    ruleId: rule.id,
    severity: rule.severity,
    code: consequence.code ?? rule.id,
    message: consequence.message,
  };
};

export function evaluateRules(
  rules: RuleSet,
  facts: ReadonlyArray<FactInput>
): ReadonlyArray<Finding> {
  const findings: Finding[] = [];

  for (const rule of rules) {
    const condition: Condition = rule.when;
    const consequence: Consequence = rule.then;
    if (!conditionMatches(condition, facts, rule.scope)) {
      continue;
    }
    if (consequence.kind === 'Finding') {
      findings.push(toFinding(rule, consequence));
    }
  }

  return findings;
}
