import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { Fact } from '../../core/facts/Fact';
import { enforceTddBddPolicy } from './enforcement';

test('enforceTddBddPolicy explica cómo registrar XCTest verde cuando falta VERIFY', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-tdd-verify-xctest-'));
  try {
    mkdirSync(join(repoRoot, 'features'), { recursive: true });
    mkdirSync(join(repoRoot, '.pumuki', 'artifacts'), { recursive: true });
    writeFileSync(join(repoRoot, 'features', 'rgo-1900.feature'), 'Feature: social auth\n', 'utf8');
    writeFileSync(
      join(repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json'),
      JSON.stringify({
        version: '1',
        generated_at: '2026-05-20T08:00:00.000Z',
        slices: [
          {
            id: 'rgo-1900',
            scenario_ref: 'features/rgo-1900.feature',
            red: {
              status: 'failed',
              timestamp: '2026-05-20T08:00:00.000Z',
              test_ref: 'RuralGoMacTests/BuyerAppViewModelAuthTests',
            },
            green: {
              status: 'passed',
              timestamp: '2026-05-20T08:10:00.000Z',
              test_ref: 'RuralGoMacTests/BuyerAppViewModelAuthTests',
            },
            refactor: {
              status: 'passed',
              timestamp: '2026-05-20T08:20:00.000Z',
              test_ref: 'RuralGoMacTests/BuyerCommerceScreensSnapshotTests/test_checkoutSnapshot_matchesReference',
            },
          },
        ],
      }),
      'utf8'
    );
    const facts: ReadonlyArray<Fact> = [
      {
        kind: 'FileChange',
        path: 'apps/ios/Presentation/Features/BuyerCommerce/BuyerAuthScreen.swift',
        changeType: 'modified',
        source: 'git:staged',
      },
      {
        kind: 'FileContent',
        path: 'apps/ios/Presentation/Features/BuyerCommerce/BuyerAuthScreen.swift',
        content: 'public struct BuyerAuthScreen {}',
        source: 'git:staged',
      },
    ];

    const result = enforceTddBddPolicy({
      facts,
      repoRoot,
      branch: 'feature/rgo-1900-02-checkout-pixel-perfect',
    });

    const finding = result.findings.find(
      (item) => item.code === 'GOLDEN_FLOW_VERIFY_EVIDENCE_MISSING'
    );
    assert.ok(finding);
    assert.match(finding.message, /missing=\[verify\.status=passed\]/);
    assert.match(finding.message, /BuyerCommerceScreensSnapshotTests/);
    assert.match(finding.expected_fix ?? '', /pumuki sdd evidence/);
    assert.match(finding.expected_fix ?? '', /--test-status=passed/);
    assert.match(finding.expected_fix ?? '', /commit atómico/);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
