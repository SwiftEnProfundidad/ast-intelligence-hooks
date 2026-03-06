import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countFindingsBySeverity,
  toEnterpriseFromLegacy,
  toTopFiles,
} from '../framework-menu-evidence-summary-severity';

test('countFindingsBySeverity agrega solo severidades válidas', () => {
  const counts = countFindingsBySeverity([
    { severity: 'ERROR' },
    { severity: 'warn' },
    { severity: 'CRITICAL' },
    { severity: 'unknown' },
  ]);

  assert.deepEqual(counts, {
    CRITICAL: 1,
    ERROR: 1,
    WARN: 1,
    INFO: 0,
  });
});

test('toEnterpriseFromLegacy traduce severidades legacy a enterprise', () => {
  assert.deepEqual(
    toEnterpriseFromLegacy({
      CRITICAL: 1,
      ERROR: 2,
      WARN: 3,
      INFO: 4,
    }),
    {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4,
    }
  );
});

test('toTopFiles agrega y ordena ficheros más frecuentes', () => {
  const topFiles = toTopFiles({
    repoRoot: '/repo/app',
    findings: [
      { file: '/repo/app/apps/backend/src/a.ts', severity: 'ERROR' },
      { file: '/repo/app/apps/backend/src/a.ts', severity: 'WARN' },
      { file: 'apps/web/src/view.tsx', severity: 'WARN' },
    ],
  });

  assert.deepEqual(topFiles, [
    { file: 'apps/backend/src/a.ts', count: 2 },
    { file: 'apps/web/src/view.tsx', count: 1 },
  ]);
});
