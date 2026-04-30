import assert from 'node:assert/strict';
import test from 'node:test';
import { applyTddBddEnforcement, resolveTddBddEnforcement } from '../tddBddEnforcement';

const withTddBddEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
  } else {
    process.env.PUMUKI_TDD_BDD_ENFORCEMENT = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
    } else {
      process.env.PUMUKI_TDD_BDD_ENFORCEMENT = previous;
    }
  }
};

test('resolveTddBddEnforcement defaults to strict mode', async () => {
  await withTddBddEnforcementEnv(undefined, () => {
    const resolved = resolveTddBddEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'default',
      blocking: true,
    });
  });
});

test('resolveTddBddEnforcement reads strict mode from environment', async () => {
  await withTddBddEnforcementEnv('strict', () => {
    const resolved = resolveTddBddEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'env',
      blocking: true,
    });
  });
});

test('resolveTddBddEnforcement falls back to strict on invalid environment value', async () => {
  await withTddBddEnforcementEnv('surprise', () => {
    const resolved = resolveTddBddEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'default',
      blocking: true,
    });
  });
});

test('resolveTddBddEnforcement no necesita env para mantener strict por defecto', async () => {
  await withTddBddEnforcementEnv(undefined, () => {
    const resolved = resolveTddBddEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'default',
      blocking: true,
    });
  });
});

test('applyTddBddEnforcement downgrades blocking findings and snapshot only with explicit advisory opt-in', async () => {
  await withTddBddEnforcementEnv('advisory', () => {
    const result = applyTddBddEnforcement({
      findings: [
        {
          ruleId: 'generic_evidence_integrity_required',
          severity: 'ERROR',
          code: 'TDD_BDD_EVIDENCE_MISSING',
          message: 'missing',
        },
      ],
      snapshot: {
        status: 'blocked',
        scope: {
          in_scope: true,
          is_new_feature: true,
          is_complex_change: false,
          reasons: ['new_feature'],
          metrics: {
            changed_files: 1,
            estimated_loc: 10,
            critical_path_files: 0,
            public_interface_files: 1,
          },
        },
        evidence: {
          path: '.pumuki/artifacts/pumuki-evidence-v1.json',
          state: 'missing',
          slices_total: 0,
          slices_valid: 0,
          slices_invalid: 0,
          integrity_ok: false,
          errors: ['missing_contract'],
        },
        waiver: {
          applied: false,
        },
      },
    });

    assert.equal(result.findings[0]?.severity, 'WARN');
    assert.equal(result.snapshot.status, 'advisory');
  });
});

test('applyTddBddEnforcement preserves blocking findings and snapshot in strict mode', async () => {
  await withTddBddEnforcementEnv('strict', () => {
    const result = applyTddBddEnforcement({
      findings: [
        {
          ruleId: 'generic_evidence_integrity_required',
          severity: 'ERROR',
          code: 'TDD_BDD_EVIDENCE_MISSING',
          message: 'missing',
        },
      ],
      snapshot: {
        status: 'blocked',
        scope: {
          in_scope: true,
          is_new_feature: true,
          is_complex_change: false,
          reasons: ['new_feature'],
          metrics: {
            changed_files: 1,
            estimated_loc: 10,
            critical_path_files: 0,
            public_interface_files: 1,
          },
        },
        evidence: {
          path: '.pumuki/artifacts/pumuki-evidence-v1.json',
          state: 'missing',
          slices_total: 0,
          slices_valid: 0,
          slices_invalid: 0,
          integrity_ok: false,
          errors: ['missing_contract'],
        },
        waiver: {
          applied: false,
        },
      },
    });

    assert.equal(result.findings[0]?.severity, 'ERROR');
    assert.equal(result.snapshot.status, 'blocked');
  });
});
