import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  severityOrder,
  severityRank,
  toBlockingFindingsCount,
  toHighestSeverity,
  toSeverityCounts,
} from '../evidenceFacetsSeverity';

const findings = (
  items: Array<{ severity: AiEvidenceV2_1['snapshot']['findings'][number]['severity'] }>
): AiEvidenceV2_1['snapshot']['findings'] =>
  items.map((item, index) => ({
    ruleId: `rule-${index}`,
    severity: item.severity,
    code: `CODE_${index}`,
    message: `message-${index}`,
    file: `apps/backend/src/file-${index}.ts`,
  }));

test('severity facets exponen contrato base esperado', () => {
  assert.deepEqual(severityOrder, ['CRITICAL', 'ERROR', 'WARN', 'INFO']);
  assert.deepEqual(severityRank, {
    CRITICAL: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
  });
});

test('toSeverityCounts devuelve conteos ordenados por severidad', () => {
  const counts = toSeverityCounts(
    findings([
      { severity: 'WARN' },
      { severity: 'ERROR' },
      { severity: 'WARN' },
      { severity: 'CRITICAL' },
      { severity: 'INFO' },
    ]),
  );

  assert.deepEqual(counts, {
    CRITICAL: 1,
    ERROR: 1,
    WARN: 2,
    INFO: 1,
  });
  assert.deepEqual(Object.keys(counts), ['CRITICAL', 'ERROR', 'WARN', 'INFO']);
});

test('toHighestSeverity devuelve la severidad más alta o null', () => {
  assert.equal(toHighestSeverity(findings([])), null);
  assert.equal(
    toHighestSeverity(
      findings([
        { severity: 'INFO' },
        { severity: 'WARN' },
        { severity: 'ERROR' },
      ]),
    ),
    'ERROR',
  );
  assert.equal(
    toHighestSeverity(
      findings([
        { severity: 'WARN' },
        { severity: 'CRITICAL' },
        { severity: 'ERROR' },
      ]),
    ),
    'CRITICAL',
  );
});

test('toBlockingFindingsCount cuenta ERROR y CRITICAL', () => {
  const count = toBlockingFindingsCount(
    findings([
      { severity: 'INFO' },
      { severity: 'WARN' },
      { severity: 'ERROR' },
      { severity: 'CRITICAL' },
      { severity: 'ERROR' },
    ]),
  );

  assert.equal(count, 3);
});
