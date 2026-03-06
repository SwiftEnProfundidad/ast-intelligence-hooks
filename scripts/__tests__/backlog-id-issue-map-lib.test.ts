import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeIdIssueMapRecords,
  parseIdIssueMapRecord,
  recordToIdIssueMap,
} from '../backlog-id-issue-map-lib';

test('parseIdIssueMapRecord normaliza valores válidos number/string', () => {
  const record = parseIdIssueMapRecord(
    JSON.stringify({
      'PUMUKI-001': 100,
      'PUM-001': 150,
      'PUMUKI-INC-020': '200',
      'FP-010': 300,
      'AST-GAP-005': '400',
    })
  );

  assert.deepEqual(record, {
    'PUMUKI-001': 100,
    'PUM-001': 150,
    'PUMUKI-INC-020': 200,
    'FP-010': 300,
    'AST-GAP-005': 400,
  });
});

test('parseIdIssueMapRecord falla para ids inválidos', () => {
  assert.throws(
    () =>
      parseIdIssueMapRecord(
        JSON.stringify({
          INVALID: 123,
        })
      ),
    /Invalid id/
  );
});

test('mergeIdIssueMapRecords aplica override explícito sobre base', () => {
  const merged = mergeIdIssueMapRecords(
    {
      'PUMUKI-INC-300': 710,
      'FP-020': 711,
    },
    {
      'FP-020': 999,
      'AST-GAP-005': 712,
    }
  );

  assert.deepEqual(merged, {
    'PUMUKI-INC-300': 710,
    'FP-020': 999,
    'AST-GAP-005': 712,
  });
});

test('recordToIdIssueMap convierte record a ReadonlyMap', () => {
  const map = recordToIdIssueMap({
    'PUMUKI-001': 100,
    'PUMUKI-INC-020': 200,
  });

  assert.ok(map);
  assert.equal(map?.get('PUMUKI-001'), 100);
  assert.equal(map?.get('PUMUKI-INC-020'), 200);
});
