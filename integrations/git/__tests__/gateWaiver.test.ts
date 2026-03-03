import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { resolveActiveGateWaiver } from '../gateWaiver';

test('resolveActiveGateWaiver aplica waiver válido por stage y branch', async () => {
  await withTempDir('pumuki-gate-waiver-valid-', async (repoRoot) => {
    const waiverDir = join(repoRoot, '.pumuki', 'waivers');
    mkdirSync(waiverDir, { recursive: true });
    writeFileSync(
      join(waiverDir, 'gate.json'),
      JSON.stringify(
        {
          version: '1',
          waivers: [
            {
              id: 'waiver-valid-1',
              stage: 'PRE_PUSH',
              reason: 'maintenance window',
              owner: 'tech-lead',
              approved_at: '2026-03-03T20:00:00.000Z',
              expires_at: '2099-12-31T23:59:59.000Z',
              branch: 'feature/x',
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    const result = resolveActiveGateWaiver({
      repoRoot,
      stage: 'PRE_PUSH',
      branch: 'feature/x',
    });

    assert.equal(result.kind, 'applied');
    if (result.kind === 'applied') {
      assert.equal(result.waiver.id, 'waiver-valid-1');
      assert.equal(result.waiver.owner, 'tech-lead');
    }
  });
});

test('resolveActiveGateWaiver devuelve expired cuando el waiver de stage está caducado', async () => {
  await withTempDir('pumuki-gate-waiver-expired-', async (repoRoot) => {
    const waiverDir = join(repoRoot, '.pumuki', 'waivers');
    mkdirSync(waiverDir, { recursive: true });
    writeFileSync(
      join(waiverDir, 'gate.json'),
      JSON.stringify(
        {
          version: '1',
          waivers: [
            {
              id: 'waiver-expired-1',
              stage: 'PRE_COMMIT',
              reason: 'legacy stabilization',
              owner: 'platform-owner',
              approved_at: '2024-01-01T00:00:00.000Z',
              expires_at: '2024-01-15T00:00:00.000Z',
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    const result = resolveActiveGateWaiver({
      repoRoot,
      stage: 'PRE_COMMIT',
      branch: 'feature/x',
      now: new Date('2026-03-03T00:00:00.000Z'),
    });

    assert.equal(result.kind, 'expired');
    if (result.kind === 'expired') {
      assert.equal(result.waiver.id, 'waiver-expired-1');
    }
  });
});

test('resolveActiveGateWaiver devuelve invalid para waiver malformado', async () => {
  await withTempDir('pumuki-gate-waiver-invalid-', async (repoRoot) => {
    const waiverDir = join(repoRoot, '.pumuki', 'waivers');
    mkdirSync(waiverDir, { recursive: true });
    writeFileSync(
      join(waiverDir, 'gate.json'),
      JSON.stringify(
        {
          version: '1',
          waivers: [
            {
              id: 'waiver-invalid-1',
              stage: 'CI',
              reason: 'missing owner field',
              approved_at: '2026-03-03T20:00:00.000Z',
              expires_at: '2099-12-31T23:59:59.000Z',
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    const result = resolveActiveGateWaiver({
      repoRoot,
      stage: 'CI',
      branch: 'feature/x',
    });

    assert.equal(result.kind, 'invalid');
    if (result.kind === 'invalid') {
      assert.match(result.reason, /expected string/i);
    }
  });
});
