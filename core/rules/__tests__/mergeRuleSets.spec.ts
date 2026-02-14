import { mergeRuleSets } from '../mergeRuleSets';
import type { RuleDefinition } from '../RuleDefinition';
import type { RuleSet } from '../RuleSet';

describe('mergeRuleSets', () => {
  it('keeps locked baseline severity when override lowers it', () => {
    const baselineRule: RuleDefinition = {
      id: 'locked.rule',
      description: 'baseline',
      severity: 'CRITICAL',
      when: { kind: 'FileChange' },
      then: { kind: 'Finding', message: 'baseline', code: 'BASE' },
      locked: true,
    };
    const projectRule: RuleDefinition = {
      id: 'locked.rule',
      description: 'project',
      severity: 'WARN',
      when: { kind: 'FileChange' },
      then: { kind: 'Finding', message: 'project', code: 'PROJ' },
    };

    const result = mergeRuleSets([baselineRule], [projectRule]);

    expect(result[0].severity).toBe('CRITICAL');
  });

  it('keeps locked baseline conditions when override changes them', () => {
    const baselineRule: RuleDefinition = {
      id: 'locked.conditions',
      description: 'baseline',
      severity: 'CRITICAL',
      when: { kind: 'FileChange', where: { pathPrefix: 'domain/' } },
      then: { kind: 'Finding', message: 'baseline', code: 'BASE' },
      locked: true,
    };
    const projectRule: RuleDefinition = {
      id: 'locked.conditions',
      description: 'project',
      severity: 'CRITICAL',
      when: { kind: 'FileChange', where: { pathPrefix: 'tests/' } },
      then: { kind: 'Finding', message: 'project', code: 'PROJ' },
    };

    const result = mergeRuleSets([baselineRule], [projectRule]);

    expect(result[0].when).toEqual(baselineRule.when);
  });

  it('keeps locked baseline rules even when project omits them', () => {
    const baselineRule: RuleDefinition = {
      id: 'locked.missing',
      description: 'baseline',
      severity: 'CRITICAL',
      when: { kind: 'FileChange' },
      then: { kind: 'Finding', message: 'baseline', code: 'BASE' },
      locked: true,
    };

    const result = mergeRuleSets([baselineRule], [] as RuleSet);

    expect(result.map((rule) => rule.id)).toEqual(['locked.missing']);
  });

  it('allows unlocked overrides to lower severity', () => {
    const baselineRule: RuleDefinition = {
      id: 'unlocked.rule',
      description: 'baseline',
      severity: 'CRITICAL',
      when: { kind: 'FileChange' },
      then: { kind: 'Finding', message: 'baseline', code: 'BASE' },
      locked: false,
    };
    const projectRule: RuleDefinition = {
      id: 'unlocked.rule',
      description: 'project',
      severity: 'WARN',
      when: { kind: 'FileChange' },
      then: { kind: 'Finding', message: 'project', code: 'PROJ' },
    };

    const result = mergeRuleSets([baselineRule], [projectRule]);

    expect(result[0].severity).toBe('WARN');
  });
});
