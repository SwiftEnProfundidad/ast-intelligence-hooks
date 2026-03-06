import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeEnterpriseSeverityCounts,
  normalizeSeverity,
  toRepoRelativePath,
} from '../framework-menu-evidence-summary-normalize';

test('toRepoRelativePath normaliza rutas absolutas a repo-relative', () => {
  const file = toRepoRelativePath({
    repoRoot: '/repo/app',
    filePath: '/repo/app/apps/backend/src/a.ts',
  });
  assert.equal(file, 'apps/backend/src/a.ts');
});

test('normalizeSeverity acepta severidades legacy conocidas', () => {
  assert.equal(normalizeSeverity(' error '), 'ERROR');
  assert.equal(normalizeSeverity('warn'), 'WARN');
  assert.equal(normalizeSeverity('meh'), null);
});

test('normalizeEnterpriseSeverityCounts sanea métricas inválidas', () => {
  assert.deepEqual(
    normalizeEnterpriseSeverityCounts({
      CRITICAL: 2,
      HIGH: 'x',
      MEDIUM: -4,
      LOW: 1.8,
    }),
    {
      CRITICAL: 2,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 1,
    }
  );
});
