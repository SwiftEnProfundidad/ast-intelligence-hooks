import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  readMcpAiGateReceipt,
  resolveMcpAiGateReceiptPath,
  writeMcpAiGateReceipt,
} from '../aiGateReceipt';

test('readMcpAiGateReceipt returns missing when receipt file does not exist', async () => {
  await withTempDir('pumuki-mcp-receipt-', async (repoRoot) => {
    const result = readMcpAiGateReceipt(repoRoot);
    assert.equal(result.kind, 'missing');
    assert.equal(result.path, resolveMcpAiGateReceiptPath(repoRoot));
  });
});

test('writeMcpAiGateReceipt persists payload and readMcpAiGateReceipt loads it', async () => {
  await withTempDir('pumuki-mcp-receipt-', async (repoRoot) => {
    const written = writeMcpAiGateReceipt({
      repoRoot,
      stage: 'PRE_WRITE',
      status: 'ALLOWED',
      allowed: true,
      issuedAt: '2026-02-28T13:00:00.000Z',
    });

    assert.equal(written.path, resolveMcpAiGateReceiptPath(repoRoot));
    const result = readMcpAiGateReceipt(repoRoot);
    assert.equal(result.kind, 'valid');
    assert.equal(result.receipt.stage, 'PRE_WRITE');
    assert.equal(result.receipt.status, 'ALLOWED');
    assert.equal(result.receipt.allowed, true);
    assert.equal(result.receipt.issued_at, '2026-02-28T13:00:00.000Z');
  });
});

test('readMcpAiGateReceipt returns invalid for incoherent payload', async () => {
  await withTempDir('pumuki-mcp-receipt-', async (repoRoot) => {
    const path = resolveMcpAiGateReceiptPath(repoRoot);
    mkdirSync(join(repoRoot, '.pumuki', 'artifacts'), { recursive: true });
    writeFileSync(
      path,
      JSON.stringify(
        {
          version: '1',
          source: 'pumuki-enterprise-mcp',
          tool: 'ai_gate_check',
          repo_root: repoRoot,
          stage: 'PRE_WRITE',
          status: 'ALLOWED',
          allowed: false,
          issued_at: '2026-02-28T13:00:00.000Z',
        },
        null,
        2
      ),
      'utf8'
    );

    const result = readMcpAiGateReceipt(repoRoot);
    assert.equal(result.kind, 'invalid');
    assert.equal(result.reason, 'Receipt status and allowed must be coherent.');
  });
});
