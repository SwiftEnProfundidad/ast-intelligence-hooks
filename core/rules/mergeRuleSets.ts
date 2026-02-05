import type { RuleDefinition } from './RuleDefinition';
import type { RuleSet } from './RuleSet';
import { isSeverityAtLeast, severityRank } from './Severity';

export type MergeOptions = {
  allowDowngradeBaseline?: boolean;
};

export type RuleSource = 'baseline' | 'project';

export function mergeRuleSets(
  baseline: RuleSet,
  project: RuleSet,
  options?: MergeOptions
): RuleSet {
  const allowDowngrade = options?.allowDowngradeBaseline === true;
  const projectById = new Map<string, RuleDefinition>(
    project.map((rule) => [rule.id, rule])
  );
  const result: RuleDefinition[] = [];

  for (const baselineRule of baseline) {
    const projectRule = projectById.get(baselineRule.id);
    if (projectRule) {
      const baselineRank = severityRank[baselineRule.severity];
      const projectRank = severityRank[projectRule.severity];
      const isAtLeast = isSeverityAtLeast(projectRule.severity, baselineRule.severity);
      if (!allowDowngrade && !isAtLeast) {
        throw new Error(
          `Baseline rule "${baselineRule.id}" severity downgrade is not allowed (baseline=${baselineRule.severity}(${baselineRank}) project=${projectRule.severity}(${projectRank})).`
        );
      }
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
