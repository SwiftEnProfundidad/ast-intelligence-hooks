import assert from 'node:assert/strict';
import test from 'node:test';

import { formatEvidenceSummaryForMenu } from '../framework-menu-evidence-summary-lib';

test('formatEvidenceSummaryForMenu renderiza bloque operativo', () => {
  const rendered = formatEvidenceSummaryForMenu({
    status: 'ok',
    stage: 'CI',
    outcome: 'BLOCKED',
    totalFindings: 3,
    filesScanned: 12,
    filesAffected: 2,
    bySeverity: {
      CRITICAL: 1,
      ERROR: 1,
      WARN: 1,
      INFO: 0,
    },
    byEnterpriseSeverity: {
      CRITICAL: 1,
      HIGH: 1,
      MEDIUM: 1,
      LOW: 0,
    },
    topFiles: [
      { file: 'apps/backend/src/a.ts', count: 2 },
      { file: 'apps/ios/App/B.swift', count: 1 },
    ],
    topFileLocations: [
      { file: 'apps/backend/src/a.ts', line: 7 },
      { file: 'apps/ios/App/B.swift', line: 14 },
    ],
    topFindings: [
      { severity: 'CRITICAL', ruleId: 'rule.a', file: 'apps/backend/src/a.ts', line: 7 },
      { severity: 'HIGH', ruleId: 'rule.b', file: 'apps/ios/App/B.swift', line: 14 },
    ],
  });

  assert.match(rendered, /Evidence: status=ok stage=CI outcome=BLOCKED findings=3/);
  assert.match(rendered, /Severities \(enterprise\): critical=1 high=1 medium=1 low=0/);
  assert.match(rendered, /Top files: apps\/backend\/src\/a\.ts \(2\), apps\/ios\/App\/B\.swift \(1\)/);
});

test('formatEvidenceSummaryForMenu en missing da instruccion accionable', () => {
  const rendered = formatEvidenceSummaryForMenu({
    status: 'missing',
    stage: null,
    outcome: null,
    totalFindings: 0,
    filesScanned: 0,
    filesAffected: 0,
    bySeverity: {
      CRITICAL: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0,
    },
    byEnterpriseSeverity: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    },
    topFiles: [],
    topFileLocations: [],
    topFindings: [],
  });

  assert.match(rendered, /Evidence: status=missing/);
  assert.match(rendered, /Run `\.\/node_modules\/\.bin\/pumuki-pre-commit` to generate fresh evidence\./);
});
