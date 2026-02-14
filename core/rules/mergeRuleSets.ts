import type { RuleDefinition } from './RuleDefinition';
import type { RuleSet } from './RuleSet';
import { isSeverityAtLeast } from './Severity';

export type MergeOptions = {
  allowDowngradeBaseline?: boolean;
};

export type RuleSource = 'baseline' | 'project';

export function mergeRuleSets(
  baseline: RuleSet,
  project: RuleSet,
  options?: MergeOptions
): RuleSet {
  void options;
  const projectById = new Map<string, RuleDefinition>(
    project.map((rule) => [rule.id, rule])
  );
  const result: RuleDefinition[] = [];

  for (const baselineRule of baseline) {
    const projectRule = projectById.get(baselineRule.id);
    if (baselineRule.locked) {
      if (projectRule) {
        const upgradedSeverity = isSeverityAtLeast(
          projectRule.severity,
          baselineRule.severity
        )
          ? projectRule.severity
          : baselineRule.severity;
        result.push({ ...baselineRule, severity: upgradedSeverity });
        projectById.delete(baselineRule.id);
      } else {
        result.push(baselineRule);
      }
      continue;
    }

    if (projectRule) {
      result.push(projectRule);
      projectById.delete(baselineRule.id);
    } else {
      result.push(baselineRule);
    }
  }

  for (const projectRule of projectById.values()) {
    result.push(projectRule);
  }

  return result;
}
