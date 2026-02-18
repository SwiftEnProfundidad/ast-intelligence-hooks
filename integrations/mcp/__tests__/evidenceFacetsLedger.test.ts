import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toLedgerByPlatform,
  toLedgerFilesCount,
  toLedgerRulesCount,
} from '../evidenceFacetsLedger';

const sampleLedger: AiEvidenceV2_1['ledger'] = [
  {
    ruleId: 'backend.avoid-explicit-any',
    file: 'apps/backend/src/userService.ts',
    firstSeen: '2026-02-17T00:00:00.000Z',
    lastSeen: '2026-02-18T00:00:00.000Z',
  },
  {
    ruleId: 'ios.no-force-unwrap',
    file: 'apps/ios/App/Feature.swift',
    firstSeen: '2026-02-17T00:00:00.000Z',
    lastSeen: '2026-02-18T00:00:00.000Z',
  },
  {
    ruleId: 'frontend.no-console-log',
    file: 'apps/frontend/src/components/Banner.tsx',
    firstSeen: '2026-02-17T00:00:00.000Z',
    lastSeen: '2026-02-18T00:00:00.000Z',
  },
  {
    ruleId: 'android.no-thread-sleep',
    file: 'apps/android/app/src/main/java/com/example/Main.kt',
    firstSeen: '2026-02-17T00:00:00.000Z',
    lastSeen: '2026-02-18T00:00:00.000Z',
  },
  {
    ruleId: 'generic.no-debugger',
    file: 'src/shared/debug.ts',
    firstSeen: '2026-02-17T00:00:00.000Z',
    lastSeen: '2026-02-18T00:00:00.000Z',
  },
  {
    ruleId: 'ios.no-force-unwrap',
    file: 'apps/ios/App/Feature.swift',
    firstSeen: '2026-02-18T00:00:00.000Z',
    lastSeen: '2026-02-18T12:00:00.000Z',
  },
];

test('toLedgerByPlatform groups ledger entries by inferred platform in deterministic order', () => {
  assert.deepEqual(toLedgerByPlatform(sampleLedger), {
    android: 1,
    backend: 1,
    frontend: 1,
    generic: 1,
    ios: 2,
  });
});

test('ledger counters compute unique files and unique rules', () => {
  assert.equal(toLedgerFilesCount(sampleLedger), 5);
  assert.equal(toLedgerRulesCount(sampleLedger), 5);
});

test('ledger helpers return empty values on empty input', () => {
  assert.deepEqual(toLedgerByPlatform([]), {});
  assert.equal(toLedgerFilesCount([]), 0);
  assert.equal(toLedgerRulesCount([]), 0);
});
