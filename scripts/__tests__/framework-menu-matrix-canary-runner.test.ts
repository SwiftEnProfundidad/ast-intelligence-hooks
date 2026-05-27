import assert from 'node:assert/strict';
import test from 'node:test';

import { runConsumerMenuCanary } from '../framework-menu-matrix-canary-lib';

test('runConsumerMenuCanary exige detección real skills.* en las cuatro plataformas', async (t) => {
  const cases = [
    {
      platform: 'backend',
      expectedRuleId: 'skills.backend.no-empty-catch',
    },
    {
      platform: 'frontend',
      expectedRuleId: 'skills.frontend.avoid-explicit-any',
    },
    {
      platform: 'ios',
      expectedRuleId: 'skills.ios.no-force-unwrap',
      acceptedRuleIds: ['skills.ios.no-force-unwrap', 'ios.no-force-unwrap'],
    },
    {
      platform: 'android',
      expectedRuleId: 'skills.android.no-runblocking',
    },
  ] as const;

  for (const entry of cases) {
    await t.test(entry.platform, async () => {
      const result = await runConsumerMenuCanary({
        repoRoot: process.cwd(),
        platform: entry.platform,
      });

      assert.equal(result.option, '1');
      assert.equal(typeof result.detected, 'boolean');
      assert.equal(result.outcome, 'BLOCK');
      assert.equal(result.diagnosis, 'violations-detected');
      assert.equal(result.canaryRuleMatched, true);
      assert.equal(typeof result.totalViolations, 'number');
      assert.equal(typeof result.filesScanned, 'number');
      assert.equal(
        result.detected,
        true,
        `${entry.platform} debe bloquear por ${entry.expectedRuleId}; ruleIds=${result.ruleIds.join(',')}`
      );
      assert.equal(
        ('acceptedRuleIds' in entry ? entry.acceptedRuleIds : [entry.expectedRuleId]).some((ruleId) =>
          result.ruleIds.includes(ruleId)
        ),
        true,
        `${entry.platform} debe materializar ${entry.expectedRuleId}; ruleIds=${result.ruleIds.join(',')}`
      );
      assert.equal(
        typeof result.canaryRelativePath,
        'string',
        `${entry.platform} debe devolver la ruta canaria auditada`
      );
      assert.ok(result.totalViolations > 0);
      assert.ok(result.filesScanned > 0);
    });
  }
});

test('runConsumerMenuCanary permite canario controlado PRE_PUSH/frontend', async () => {
  const result = await runConsumerMenuCanary({
    repoRoot: process.cwd(),
    stage: 'PRE_PUSH',
    platform: 'frontend',
    dependencies: {
      runGate: async () => {},
      readOptionReport: () => ({
        stage: 'PRE_PUSH',
        outcome: 'BLOCK',
        filesScanned: 50,
        totalViolations: 1,
        diagnosis: 'violations-detected',
      }),
      extractRuleIds: () => ['skills.frontend.avoid-explicit-any'],
      extractRuleMatches: (_repoRoot, scenario) => [
        {
          ruleId: 'skills.frontend.avoid-explicit-any',
          filePath: scenario.canaryRelativePath,
        },
      ],
    },
  });

  assert.equal(result.option, '2');
  assert.equal(result.detected, true);
  assert.equal(result.outcome, 'BLOCK');
  assert.equal(result.diagnosis, 'violations-detected');
  assert.equal(result.canaryRuleMatched, true);
  assert.equal(result.totalViolations, 1);
  assert.equal(result.filesScanned, 50);
  assert.equal(result.ruleIds.includes('skills.frontend.avoid-explicit-any'), true);
});

test('runConsumerMenuCanary soporta canario controlado CI/android', async () => {
  const result = await runConsumerMenuCanary({
    repoRoot: process.cwd(),
    stage: 'CI',
    platform: 'android',
    dependencies: {
      runGate: async () => {},
      readOptionReport: () => ({
        stage: 'CI',
        outcome: 'BLOCK',
        filesScanned: 75,
        totalViolations: 1,
        diagnosis: 'violations-detected',
      }),
      extractRuleIds: () => ['skills.android.no-runblocking'],
      extractRuleMatches: (_repoRoot, scenario) => [
        {
          ruleId: 'skills.android.no-runblocking',
          filePath: scenario.canaryRelativePath,
        },
      ],
    },
  });

  assert.equal(result.option, '2');
  assert.equal(result.detected, true);
  assert.equal(result.outcome, 'BLOCK');
  assert.equal(result.diagnosis, 'violations-detected');
  assert.equal(result.canaryRuleMatched, true);
  assert.equal(result.totalViolations, 1);
  assert.equal(result.filesScanned, 75);
  assert.equal(result.ruleIds.includes('skills.android.no-runblocking'), true);
});
