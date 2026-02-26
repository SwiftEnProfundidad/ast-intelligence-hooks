import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { enforceTddBddPolicy } from '../../tdd/enforcement';

const withEnv = async (
  key: string,
  value: string | undefined,
  callback: () => Promise<void>
): Promise<void> => {
  const previous = process.env[key];
  if (typeof value === 'undefined') {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  try {
    await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  }
};

const addedFeatureFacts = (): ReadonlyArray<Fact> => [
  {
    kind: 'FileChange',
    source: 'test',
    path: 'apps/backend/src/orders/create-order.ts',
    changeType: 'added',
  },
  {
    kind: 'FileContent',
    source: 'test',
    path: 'apps/backend/src/orders/create-order.ts',
    content: 'export function createOrder() { return { ok: true }; }',
  },
];

test('enforceTddBddPolicy devuelve skipped cuando el cambio no entra en alcance', async () => {
  const result = enforceTddBddPolicy({
    repoRoot: process.cwd(),
    branch: null,
    facts: [
      {
        kind: 'FileChange',
        source: 'test',
        path: 'apps/backend/src/orders/create-order.spec.ts',
        changeType: 'modified',
      },
    ],
  });

  assert.equal(result.snapshot.status, 'skipped');
  assert.equal(result.snapshot.scope.in_scope, false);
  assert.deepEqual(result.findings, []);
});

test('enforceTddBddPolicy bloquea cuando falta contrato de evidencia en cambio in-scope', async () => {
  await withTempDir('pumuki-tdd-enforce-missing-', async (repoRoot) => {
    const result = enforceTddBddPolicy({
      repoRoot,
      branch: 'feature/tdd',
      facts: addedFeatureFacts(),
    });

    assert.equal(result.snapshot.status, 'blocked');
    assert.equal(result.snapshot.scope.in_scope, true);
    assert.equal(
      result.findings.some((finding) => finding.code === 'TDD_BDD_EVIDENCE_MISSING'),
      true
    );
  });
});

test('enforceTddBddPolicy pasa cuando contrato es valido y enlaza .feature existente', async () => {
  await withTempDir('pumuki-tdd-enforce-valid-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki', 'artifacts'), { recursive: true });
    mkdirSync(join(repoRoot, 'features'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'features', 'checkout.feature'),
      'Feature: Checkout\n  Scenario: user checkout\n',
      'utf8'
    );
    writeFileSync(
      join(repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json'),
      JSON.stringify(
        {
          version: '1',
          generated_at: '2026-02-26T10:00:00.000Z',
          slices: [
            {
              id: 'slice-1',
              scenario_ref: 'features/checkout.feature:2',
              red: { status: 'failed', timestamp: '2026-02-26T10:00:00.000Z' },
              green: { status: 'passed', timestamp: '2026-02-26T10:01:00.000Z' },
              refactor: { status: 'passed', timestamp: '2026-02-26T10:02:00.000Z' },
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    const result = enforceTddBddPolicy({
      repoRoot,
      branch: 'feature/tdd',
      facts: addedFeatureFacts(),
    });

    assert.equal(result.snapshot.status, 'passed');
    assert.equal(result.snapshot.evidence.state, 'valid');
    assert.equal(result.snapshot.evidence.slices_valid, 1);
    assert.equal(result.findings.length, 0);
  });
});

test('enforceTddBddPolicy bloquea cuando scenario_ref no apunta a archivo .feature real', async () => {
  await withTempDir('pumuki-tdd-enforce-missing-feature-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki', 'artifacts'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json'),
      JSON.stringify(
        {
          version: '1',
          generated_at: '2026-02-26T10:00:00.000Z',
          slices: [
            {
              id: 'slice-1',
              scenario_ref: 'features/not-found.feature:2',
              red: { status: 'failed', timestamp: '2026-02-26T10:00:00.000Z' },
              green: { status: 'passed', timestamp: '2026-02-26T10:01:00.000Z' },
              refactor: { status: 'passed', timestamp: '2026-02-26T10:02:00.000Z' },
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    const result = enforceTddBddPolicy({
      repoRoot,
      branch: 'feature/tdd',
      facts: addedFeatureFacts(),
    });

    assert.equal(result.snapshot.status, 'blocked');
    assert.equal(
      result.findings.some((finding) => finding.ruleId === 'generic_bdd_feature_required'),
      true
    );
  });
});

test('enforceTddBddPolicy aplica waiver auditable con un aprobador y no bloquea', async () => {
  await withTempDir('pumuki-tdd-enforce-waiver-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki', 'waivers'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'waivers', 'tdd-bdd.json'),
      JSON.stringify(
        {
          version: '1',
          waivers: [
            {
              id: 'waiver-1',
              rule: 'tdd-bdd-vertical',
              reason: 'incident hotfix',
              approved_by: 'tech-lead',
              approved_at: '2026-02-26T10:00:00.000Z',
              expires_at: '2026-02-27T10:00:00.000Z',
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    await withEnv('TZ', 'UTC', async () => {
      const result = enforceTddBddPolicy({
        repoRoot,
        branch: 'feature/tdd',
        facts: addedFeatureFacts(),
      });

      assert.equal(result.snapshot.status, 'waived');
      assert.equal(result.snapshot.waiver.applied, true);
      assert.equal(
        result.findings.some((finding) => finding.code === 'TDD_BDD_WAIVER_APPLIED'),
        true
      );
    });
  });
});
