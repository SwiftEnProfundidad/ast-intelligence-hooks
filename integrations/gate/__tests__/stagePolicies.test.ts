import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { RuleSet } from '../../../core/rules/RuleSet';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  applyHeuristicSeverityForStage,
  resolvePolicyForStage,
} from '../stagePolicies';

test('resolvePolicyForStage returns default PRE_PUSH policy when skills policy is absent', async () => {
  await withTempDir('pumuki-stage-policy-direct-default-', async (repoRoot) => {
    const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
    assert.deepEqual(resolved.policy, {
      stage: 'PRE_PUSH',
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    });
    assert.equal(resolved.trace.source, 'default');
    assert.equal(resolved.trace.bundle, 'gate-policy.default.PRE_PUSH');
    assert.match(resolved.trace.hash, /^[a-f0-9]{64}$/i);
  });
});

test('resolvePolicyForStage applies PRE_PUSH override from skills.policy.json', async () => {
  await withTempDir('pumuki-stage-policy-direct-override-', async (repoRoot) => {
    const skillsPolicy = {
      version: '1.0',
      defaultBundleEnabled: true,
      stages: {
        PRE_COMMIT: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
        PRE_PUSH: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
        CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
      },
      bundles: {},
    };

    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(skillsPolicy, null, 2),
      'utf8'
    );

    const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
    assert.deepEqual(resolved.policy, {
      stage: 'PRE_PUSH',
      blockOnOrAbove: 'CRITICAL',
      warnOnOrAbove: 'ERROR',
    });
    assert.equal(resolved.trace.source, 'skills.policy');
    assert.equal(resolved.trace.bundle, 'gate-policy.skills.policy.PRE_PUSH');
    assert.match(resolved.trace.hash, /^[a-f0-9]{64}$/i);
  });
});

test('applyHeuristicSeverityForStage promotes only selected heuristic rules in PRE_PUSH', () => {
  const rules: RuleSet = [
    {
      id: 'heuristics.ts.console-log.ast',
      description: 'promoted rule',
      severity: 'WARN',
      platform: 'backend',
      stage: 'PRE_COMMIT',
      when: { kind: 'Heuristic', where: { ruleId: 'heuristics.ts.console-log.ast' } },
      then: { kind: 'Finding', message: 'promoted' },
    },
    {
      id: 'custom.rule.keep-warn',
      description: 'non promoted rule',
      severity: 'WARN',
      platform: 'backend',
      stage: 'PRE_COMMIT',
      when: { kind: 'Heuristic', where: { ruleId: 'custom.rule.keep-warn' } },
      then: { kind: 'Finding', message: 'not promoted' },
    },
  ];

  const promoted = applyHeuristicSeverityForStage(rules, 'PRE_PUSH');
  const preCommit = applyHeuristicSeverityForStage(rules, 'PRE_COMMIT');

  assert.equal(promoted[0]?.severity, 'ERROR');
  assert.equal(promoted[1]?.severity, 'WARN');
  assert.equal(preCommit[0]?.severity, 'WARN');
  assert.equal(rules[0]?.severity, 'WARN');
  assert.notEqual(promoted, rules);
});
