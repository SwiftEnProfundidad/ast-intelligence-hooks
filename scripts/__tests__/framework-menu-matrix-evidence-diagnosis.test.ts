import assert from 'node:assert/strict';
import test from 'node:test';
import { toMatrixOptionReport } from '../framework-menu-matrix-evidence-lib';
import type { LegacyAuditSummary } from '../framework-menu-legacy-audit-lib';

const buildSummary = (overrides: Partial<LegacyAuditSummary>): LegacyAuditSummary => {
  return {
    status: 'ok',
    stage: 'PRE_COMMIT',
    outcome: 'PASS',
    totalViolations: 0,
    filesScanned: 0,
    filesAffected: 0,
    bySeverity: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    },
    patternChecks: {
      todoFixme: 0,
      consoleLog: 0,
      anyType: 0,
      sqlRaw: 0,
    },
    eslint: {
      errors: 0,
      warnings: 0,
    },
    platforms: [],
    rulesets: [],
    topViolations: [],
    topFiles: [],
    codeHealthScore: 100,
    ...overrides,
  };
};

test('toMatrixOptionReport clasifica scope vacío cuando no hay archivos escaneados', () => {
  const report = toMatrixOptionReport('3', buildSummary({ filesScanned: 0, totalViolations: 0 }));
  assert.equal(report.diagnosis, 'scope-empty');
});

test('toMatrixOptionReport clasifica repo limpio cuando hay escaneo sin violaciones', () => {
  const report = toMatrixOptionReport('1', buildSummary({ filesScanned: 25, totalViolations: 0 }));
  assert.equal(report.diagnosis, 'repo-clean');
});

test('toMatrixOptionReport clasifica violaciones detectadas cuando totalViolations > 0', () => {
  const report = toMatrixOptionReport('2', buildSummary({ filesScanned: 25, totalViolations: 3 }));
  assert.equal(report.diagnosis, 'violations-detected');
});
