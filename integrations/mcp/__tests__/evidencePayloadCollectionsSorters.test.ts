import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  inferFindingPlatform,
  sortLedger,
  sortSnapshotFindings,
} from '../evidencePayloadCollectionsSorters';

const finding = (
  value: Partial<AiEvidenceV2_1['snapshot']['findings'][number]>
): AiEvidenceV2_1['snapshot']['findings'][number] => ({
  ruleId: 'rule-default',
  severity: 'WARN',
  code: 'CODE',
  message: 'message',
  file: 'apps/backend/src/file.ts',
  ...value,
});

const ledgerEntry = (
  value: Partial<AiEvidenceV2_1['ledger'][number]>
): AiEvidenceV2_1['ledger'][number] => ({
  ruleId: 'rule-default',
  file: 'apps/backend/src/file.ts',
  firstSeen: '2026-01-01T00:00:00.000Z',
  lastSeen: '2026-01-02T00:00:00.000Z',
  ...value,
});

test('sortSnapshotFindings ordena por rule, file, lines, code, severity y message', () => {
  const sorted = sortSnapshotFindings([
    finding({ ruleId: 'rule-a', file: 'apps/backend/src/z.ts', lines: [2], code: 'B' }),
    finding({ ruleId: 'rule-a', file: 'apps/backend/src/z.ts', lines: [2], code: 'A' }),
    finding({ ruleId: 'rule-a', file: 'apps/backend/src/z.ts', lines: [1], code: 'A' }),
    finding({ ruleId: 'rule-a', file: 'apps/backend/src/a.ts', lines: [9], code: 'A' }),
    finding({ ruleId: 'rule-0', file: 'apps/backend/src/m.ts', lines: [0], code: 'A' }),
    finding({
      ruleId: 'rule-a',
      file: 'apps/backend/src/z.ts',
      lines: [2],
      code: 'A',
      severity: 'ERROR',
      message: 'a',
    }),
  ]);

  assert.deepEqual(
    sorted.map((entry) => `${entry.ruleId}|${entry.file}|${String(entry.lines)}|${entry.code}|${entry.severity}|${entry.message}`),
    [
      'rule-0|apps/backend/src/m.ts|0|A|WARN|message',
      'rule-a|apps/backend/src/a.ts|9|A|WARN|message',
      'rule-a|apps/backend/src/z.ts|1|A|WARN|message',
      'rule-a|apps/backend/src/z.ts|2|A|ERROR|a',
      'rule-a|apps/backend/src/z.ts|2|A|WARN|message',
      'rule-a|apps/backend/src/z.ts|2|B|WARN|message',
    ]
  );
});

test('sortLedger ordena por rule, file, lines, firstSeen y lastSeen', () => {
  const sorted = sortLedger([
    ledgerEntry({
      ruleId: 'rule-a',
      file: 'apps/backend/src/z.ts',
      lines: [2],
      firstSeen: '2026-01-02T00:00:00.000Z',
      lastSeen: '2026-01-05T00:00:00.000Z',
    }),
    ledgerEntry({
      ruleId: 'rule-a',
      file: 'apps/backend/src/z.ts',
      lines: [2],
      firstSeen: '2026-01-01T00:00:00.000Z',
      lastSeen: '2026-01-05T00:00:00.000Z',
    }),
    ledgerEntry({
      ruleId: 'rule-a',
      file: 'apps/backend/src/z.ts',
      lines: [2],
      firstSeen: '2026-01-01T00:00:00.000Z',
      lastSeen: '2026-01-04T00:00:00.000Z',
    }),
    ledgerEntry({ ruleId: 'rule-a', file: 'apps/backend/src/a.ts', lines: [7] }),
    ledgerEntry({ ruleId: 'rule-0', file: 'apps/backend/src/m.ts', lines: [0] }),
  ]);

  assert.deepEqual(
    sorted.map((entry) => `${entry.ruleId}|${entry.file}|${String(entry.lines)}|${entry.firstSeen}|${entry.lastSeen}`),
    [
      'rule-0|apps/backend/src/m.ts|0|2026-01-01T00:00:00.000Z|2026-01-02T00:00:00.000Z',
      'rule-a|apps/backend/src/a.ts|7|2026-01-01T00:00:00.000Z|2026-01-02T00:00:00.000Z',
      'rule-a|apps/backend/src/z.ts|2|2026-01-01T00:00:00.000Z|2026-01-04T00:00:00.000Z',
      'rule-a|apps/backend/src/z.ts|2|2026-01-01T00:00:00.000Z|2026-01-05T00:00:00.000Z',
      'rule-a|apps/backend/src/z.ts|2|2026-01-02T00:00:00.000Z|2026-01-05T00:00:00.000Z',
    ]
  );
});

test('inferFindingPlatform delega inferencia por ruta/extensión', () => {
  assert.equal(inferFindingPlatform(finding({ file: 'apps/ios/App/Feature.swift' })), 'ios');
  assert.equal(inferFindingPlatform(finding({ file: 'apps/backend/src/health.ts' })), 'backend');
  assert.equal(inferFindingPlatform(finding({ file: 'apps/frontend/src/App.tsx' })), 'frontend');
  assert.equal(inferFindingPlatform(finding({ file: 'apps/android/app/src/main/Main.kt' })), 'android');
  assert.equal(inferFindingPlatform(finding({ file: 'scripts/utility.sh' })), 'generic');
});
