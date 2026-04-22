import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { RuleSet } from '../../../core/rules/RuleSet';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  applyHeuristicSeverityForStage,
  mapEnterpriseSeverityToGateSeverity,
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
    assert.equal(resolved.trace.version, 'policy-as-code/default@1.0');
    assert.match(resolved.trace.signature ?? '', /^[a-f0-9]{64}$/i);
    assert.equal(resolved.trace.policySource, 'computed-local');
    assert.equal(resolved.trace.validation?.status, 'valid');
    assert.equal(resolved.trace.validation?.code, 'POLICY_AS_CODE_VALID');
  });
});

test('resolvePolicyForStage marks unsigned in strict mode when policy-as-code contract is missing', async () => {
  await withTempDir('pumuki-stage-policy-unsigned-strict-', async (repoRoot) => {
    const previousStrict = process.env.PUMUKI_POLICY_STRICT;
    process.env.PUMUKI_POLICY_STRICT = '1';
    try {
      const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
      assert.equal(resolved.trace.validation?.status, 'unsigned');
      assert.equal(resolved.trace.validation?.code, 'POLICY_AS_CODE_UNSIGNED');
      assert.equal(resolved.trace.validation?.strict, true);
      assert.equal(resolved.trace.policySource, 'computed-local');
    } finally {
      if (typeof previousStrict === 'undefined') {
        delete process.env.PUMUKI_POLICY_STRICT;
      } else {
        process.env.PUMUKI_POLICY_STRICT = previousStrict;
      }
    }
  });
});

test('resolvePolicyForStage applies PRE_PUSH override from skills.policy.json', async () => {
  await withTempDir('pumuki-stage-policy-direct-override-', async (repoRoot) => {
    const skillsPolicy = {
      version: '1.0',
      defaultBundleEnabled: true,
      stages: {
        PRE_WRITE: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
        PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
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
    assert.equal(resolved.trace.version, 'policy-as-code/skills.policy@1.0');
    assert.match(resolved.trace.signature ?? '', /^[a-f0-9]{64}$/i);
    assert.equal(resolved.trace.policySource, 'computed-local');
    assert.equal(resolved.trace.validation?.status, 'valid');
    assert.equal(resolved.trace.validation?.code, 'POLICY_AS_CODE_VALID');
  });
});

test('resolvePolicyForStage marks unknown-source when policy-as-code contract source mismatches', async () => {
  await withTempDir('pumuki-stage-policy-contract-unknown-source-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'skills.policy',
          signatures: {
            PRE_COMMIT: 'a'.repeat(64),
            PRE_PUSH: 'b'.repeat(64),
            CI: 'c'.repeat(64),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
    assert.equal(resolved.trace.source, 'default');
    assert.equal(resolved.trace.validation?.status, 'unknown-source');
    assert.equal(resolved.trace.validation?.code, 'POLICY_AS_CODE_UNKNOWN_SOURCE');
    assert.equal(resolved.trace.policySource, 'file:.pumuki/policy-as-code.json');
  });
});

test('resolvePolicyForStage lee strict desde el contrato firmado cuando está declarado', async () => {
  await withTempDir('pumuki-stage-policy-contract-strict-', async (repoRoot) => {
    const baseline = resolvePolicyForStage('PRE_PUSH', repoRoot);
    const prePushSignature = baseline.trace.signature;
    assert.ok(prePushSignature);

    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'default',
          strict: {
            PRE_PUSH: true,
          },
          signatures: {
            PRE_COMMIT: 'a'.repeat(64),
            PRE_PUSH: prePushSignature,
            CI: 'c'.repeat(64),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
    assert.equal(resolved.trace.validation?.status, 'valid');
    assert.equal(resolved.trace.validation?.code, 'POLICY_AS_CODE_VALID');
    assert.equal(resolved.trace.validation?.strict, true);
  });
});

test('resolvePolicyForStage marks expired when policy-as-code contract is out of date', async () => {
  await withTempDir('pumuki-stage-policy-contract-expired-', async (repoRoot) => {
    const baseline = resolvePolicyForStage('PRE_PUSH', repoRoot);
    const prePushSignature = baseline.trace.signature;
    assert.ok(prePushSignature);

    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'default',
          expires_at: '2000-01-01T00:00:00.000Z',
          signatures: {
            PRE_COMMIT: 'a'.repeat(64),
            PRE_PUSH: prePushSignature,
            CI: 'c'.repeat(64),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
    assert.equal(resolved.trace.validation?.status, 'expired');
    assert.equal(resolved.trace.validation?.code, 'POLICY_AS_CODE_CONTRACT_EXPIRED');
    assert.equal(resolved.trace.policySource, 'file:.pumuki/policy-as-code.json');
  });
});

test('resolvePolicyForStage marks invalid when policy-as-code contract expiry is malformed', async () => {
  await withTempDir('pumuki-stage-policy-contract-invalid-expiry-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'default',
          expires_at: 'not-an-iso-date',
          signatures: {
            PRE_COMMIT: 'a'.repeat(64),
            PRE_PUSH: 'b'.repeat(64),
            CI: 'c'.repeat(64),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
    assert.equal(resolved.trace.validation?.status, 'invalid');
    assert.equal(resolved.trace.validation?.code, 'POLICY_AS_CODE_CONTRACT_INVALID');
    assert.equal(resolved.trace.policySource, 'file:.pumuki/policy-as-code.json');
  });
});

test('applyHeuristicSeverityForStage promueve heurísticas a ERROR en PRE_WRITE/PRE_COMMIT/PRE_PUSH/CI', () => {
  const rules: RuleSet = [
    {
      id: 'heuristics.ts.eval.ast',
      description: 'promoted rule',
      severity: 'WARN',
      platform: 'backend',
      stage: 'PRE_COMMIT',
      when: { kind: 'Heuristic', where: { ruleId: 'heuristics.ts.eval.ast' } },
      then: { kind: 'Finding', message: 'promoted' },
    },
    {
      id: 'heuristics.ts.empty-catch.ast',
      description: 'promoted rule',
      severity: 'WARN',
      platform: 'backend',
      stage: 'PRE_COMMIT',
      when: {
        kind: 'Heuristic',
        where: { ruleId: 'heuristics.ts.empty-catch.ast' },
      },
      then: { kind: 'Finding', message: 'promoted' },
    },
    {
      id: 'custom.rule.keep-warn',
      description: 'non promoted rule',
      severity: 'WARN',
      platform: 'backend',
      stage: 'PRE_COMMIT',
      when: {
        kind: 'Heuristic',
        where: { ruleId: 'custom.rule.keep-warn' },
      },
      then: { kind: 'Finding', message: 'not promoted' },
    },
  ];

  for (const stage of ['PRE_WRITE', 'PRE_COMMIT', 'PRE_PUSH', 'CI'] as const) {
    const adjusted = applyHeuristicSeverityForStage(rules, stage);
    assert.equal(adjusted[0]?.severity, 'ERROR');
    assert.equal(adjusted[1]?.severity, 'ERROR');
    assert.equal(adjusted[2]?.severity, 'WARN');
  }

  assert.equal(rules[0]?.severity, 'WARN');
  assert.notEqual(applyHeuristicSeverityForStage(rules, 'PRE_COMMIT'), rules);
});

test('resolvePolicyForStage aplica hard mode por entorno y bloquea desde WARN', async () => {
  await withTempDir('pumuki-stage-policy-hard-mode-', async (repoRoot) => {
    const previous = process.env.PUMUKI_HARD_MODE;
    process.env.PUMUKI_HARD_MODE = '1';
    try {
      const resolved = resolvePolicyForStage('PRE_COMMIT', repoRoot);
      assert.deepEqual(resolved.policy, {
        stage: 'PRE_COMMIT',
        blockOnOrAbove: 'WARN',
        warnOnOrAbove: 'INFO',
      });
      assert.equal(resolved.trace.source, 'hard-mode');
      assert.equal(resolved.trace.bundle, 'gate-policy.hard-mode.PRE_COMMIT');
      assert.match(resolved.trace.hash, /^[a-f0-9]{64}$/i);
    } finally {
      if (typeof previous === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previous;
      }
    }
  });
});

test('resolvePolicyForStage aplica perfil enterprise critical-high en hard mode', async () => {
  await withTempDir('pumuki-stage-policy-hard-mode-profile-', async (repoRoot) => {
    const previousHardMode = process.env.PUMUKI_HARD_MODE;
    const previousProfile = process.env.PUMUKI_HARD_MODE_PROFILE;
    process.env.PUMUKI_HARD_MODE = '1';
    process.env.PUMUKI_HARD_MODE_PROFILE = 'critical-high';
    try {
      const resolved = resolvePolicyForStage('PRE_COMMIT', repoRoot);
      assert.deepEqual(resolved.policy, {
        stage: 'PRE_COMMIT',
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'WARN',
      });
      assert.equal(resolved.trace.source, 'hard-mode');
      assert.equal(resolved.trace.bundle, 'gate-policy.hard-mode.critical-high.PRE_COMMIT');
      assert.match(resolved.trace.hash, /^[a-f0-9]{64}$/i);
    } finally {
      if (typeof previousHardMode === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previousHardMode;
      }
      if (typeof previousProfile === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE_PROFILE;
      } else {
        process.env.PUMUKI_HARD_MODE_PROFILE = previousProfile;
      }
    }
  });
});

test('resolvePolicyForStage aplica hard mode/profile desde config persistida sin variables de entorno', async () => {
  await withTempDir('pumuki-stage-policy-hard-mode-config-', async (repoRoot) => {
    const previousHardMode = process.env.PUMUKI_HARD_MODE;
    const previousProfile = process.env.PUMUKI_HARD_MODE_PROFILE;
    delete process.env.PUMUKI_HARD_MODE;
    delete process.env.PUMUKI_HARD_MODE_PROFILE;
    try {
      mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
      writeFileSync(
        join(repoRoot, '.pumuki', 'hard-mode.json'),
        JSON.stringify({ enabled: true, profile: 'critical-high' }, null, 2),
        'utf8'
      );

      const resolved = resolvePolicyForStage('CI', repoRoot);
      assert.deepEqual(resolved.policy, {
        stage: 'CI',
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'WARN',
      });
      assert.equal(resolved.trace.source, 'hard-mode');
      assert.equal(resolved.trace.bundle, 'gate-policy.hard-mode.critical-high.CI');
      assert.match(resolved.trace.hash, /^[a-f0-9]{64}$/i);
    } finally {
      if (typeof previousHardMode === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previousHardMode;
      }
      if (typeof previousProfile === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE_PROFILE;
      } else {
        process.env.PUMUKI_HARD_MODE_PROFILE = previousProfile;
      }
    }
  });
});

test('resolvePolicyForStage aplica perfil all-severities y bloquea INFO', async () => {
  await withTempDir('pumuki-stage-policy-hard-mode-all-severities-', async (repoRoot) => {
    const previousHardMode = process.env.PUMUKI_HARD_MODE;
    const previousProfile = process.env.PUMUKI_HARD_MODE_PROFILE;
    process.env.PUMUKI_HARD_MODE = '1';
    process.env.PUMUKI_HARD_MODE_PROFILE = 'all-severities';
    try {
      const resolved = resolvePolicyForStage('PRE_COMMIT', repoRoot);
      assert.deepEqual(resolved.policy, {
        stage: 'PRE_COMMIT',
        blockOnOrAbove: 'INFO',
        warnOnOrAbove: 'INFO',
      });
      assert.equal(resolved.trace.source, 'hard-mode');
      assert.equal(
        resolved.trace.bundle,
        'gate-policy.hard-mode.all-severities.PRE_COMMIT'
      );
      assert.match(resolved.trace.hash, /^[a-f0-9]{64}$/i);
    } finally {
      if (typeof previousHardMode === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previousHardMode;
      }
      if (typeof previousProfile === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE_PROFILE;
      } else {
        process.env.PUMUKI_HARD_MODE_PROFILE = previousProfile;
      }
    }
  });
});

test('resolvePolicyForStage expone contrato degraded mode desde entorno con acción block por stage', async () => {
  await withTempDir('pumuki-stage-policy-degraded-env-', async (repoRoot) => {
    const previousEnabled = process.env.PUMUKI_DEGRADED_MODE;
    const previousReason = process.env.PUMUKI_DEGRADED_REASON;
    const previousPrePush = process.env.PUMUKI_DEGRADED_ACTION_PRE_PUSH;
    process.env.PUMUKI_DEGRADED_MODE = '1';
    process.env.PUMUKI_DEGRADED_REASON = 'offline-airgapped';
    process.env.PUMUKI_DEGRADED_ACTION_PRE_PUSH = 'block';
    try {
      const resolved = resolvePolicyForStage('PRE_PUSH', repoRoot);
      assert.equal(resolved.trace.degraded?.enabled, true);
      assert.equal(resolved.trace.degraded?.action, 'block');
      assert.equal(resolved.trace.degraded?.reason, 'offline-airgapped');
      assert.equal(resolved.trace.degraded?.source, 'env');
      assert.equal(resolved.trace.degraded?.code, 'DEGRADED_MODE_BLOCKED');
    } finally {
      if (typeof previousEnabled === 'undefined') {
        delete process.env.PUMUKI_DEGRADED_MODE;
      } else {
        process.env.PUMUKI_DEGRADED_MODE = previousEnabled;
      }
      if (typeof previousReason === 'undefined') {
        delete process.env.PUMUKI_DEGRADED_REASON;
      } else {
        process.env.PUMUKI_DEGRADED_REASON = previousReason;
      }
      if (typeof previousPrePush === 'undefined') {
        delete process.env.PUMUKI_DEGRADED_ACTION_PRE_PUSH;
      } else {
        process.env.PUMUKI_DEGRADED_ACTION_PRE_PUSH = previousPrePush;
      }
    }
  });
});

test('resolvePolicyForStage expone contrato degraded mode desde archivo con acción allow por stage', async () => {
  await withTempDir('pumuki-stage-policy-degraded-file-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'degraded-mode.json'),
      JSON.stringify(
        {
          version: '1.0',
          enabled: true,
          reason: 'airgapped-enterprise',
          stages: {
            PRE_WRITE: 'allow',
            PRE_COMMIT: 'allow',
            PRE_PUSH: 'block',
            CI: 'block',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const resolved = resolvePolicyForStage('PRE_COMMIT', repoRoot);
    assert.equal(resolved.trace.degraded?.enabled, true);
    assert.equal(resolved.trace.degraded?.action, 'allow');
    assert.equal(resolved.trace.degraded?.reason, 'airgapped-enterprise');
    assert.equal(resolved.trace.degraded?.source, 'file:.pumuki/degraded-mode.json');
    assert.equal(resolved.trace.degraded?.code, 'DEGRADED_MODE_ALLOWED');
  });
});

test('mapEnterpriseSeverityToGateSeverity convierte severidades enterprise a severidades de gate', () => {
  assert.equal(mapEnterpriseSeverityToGateSeverity('CRITICAL'), 'CRITICAL');
  assert.equal(mapEnterpriseSeverityToGateSeverity('HIGH'), 'ERROR');
  assert.equal(mapEnterpriseSeverityToGateSeverity('MEDIUM'), 'WARN');
  assert.equal(mapEnterpriseSeverityToGateSeverity('LOW'), 'INFO');
});
