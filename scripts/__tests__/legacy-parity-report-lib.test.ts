import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  buildLegacyParityReport,
  formatLegacyParityReportMarkdown,
} from '../legacy-parity-report-lib';

const createFixtureDir = (): string => {
  return mkdtempSync(join(tmpdir(), 'pumuki-legacy-parity-'));
};

test('buildLegacyParityReport marca FAIL cuando enterprise queda por debajo de legacy en una regla/plataforma', () => {
  const dir = createFixtureDir();
  try {
    const legacyPath = join(dir, 'legacy.json');
    const enterprisePath = join(dir, 'enterprise.json');

    writeFileSync(
      legacyPath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            files_scanned: 2,
            findings: [
              { ruleId: 'skills.backend.no-empty-catch', severity: 'HIGH', file: 'apps/backend/src/a.ts' },
              { ruleId: 'skills.backend.no-empty-catch', severity: 'HIGH', file: 'apps/backend/src/b.ts' },
            ],
          },
          repo_state: {
            repo_root: '/tmp/repo',
          },
        },
        null,
        2
      )
    );
    writeFileSync(
      enterprisePath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            files_scanned: 2,
            findings: [{ ruleId: 'skills.backend.no-empty-catch', severity: 'HIGH', file: 'apps/backend/src/a.ts' }],
          },
          repo_state: {
            repo_root: '/tmp/repo',
          },
        },
        null,
        2
      )
    );

    const report = buildLegacyParityReport({
      legacyPath,
      enterprisePath,
    });

    assert.equal(report.dominance, 'FAIL');
    assert.equal(report.totals.comparedRules, 1);
    assert.equal(report.totals.failedRules, 1);
    assert.equal(report.rows[0]?.legacyCount, 2);
    assert.equal(report.rows[0]?.enterpriseCount, 1);
    assert.equal(report.severity.hardBlock, true);
    assert.equal(report.severity.rows.find((row) => row.severity === 'HIGH')?.dominance, 'FAIL');
    assert.equal(report.scope.matches.stage, true);
    assert.equal(report.scope.matches.filesScanned, true);
    assert.equal(report.scope.matches.repoRoot, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('buildLegacyParityReport marca PASS cuando enterprise domina legacy en todas las reglas comparadas', () => {
  const dir = createFixtureDir();
  try {
    const legacyPath = join(dir, 'legacy.json');
    const enterprisePath = join(dir, 'enterprise.json');

    writeFileSync(
      legacyPath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            files_scanned: 2,
            findings: [{ ruleId: 'skills.ios.no-force-unwrap', severity: 'CRITICAL', file: 'apps/ios/MainView.swift' }],
          },
          repo_state: {
            repo_root: '/tmp/repo',
          },
        },
        null,
        2
      )
    );
    writeFileSync(
      enterprisePath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            files_scanned: 2,
            findings: [
              { ruleId: 'skills.ios.no-force-unwrap', severity: 'CRITICAL', file: 'apps/ios/MainView.swift' },
              { ruleId: 'skills.ios.no-force-unwrap', severity: 'CRITICAL', file: 'apps/ios/DetailView.swift' },
            ],
          },
          repo_state: {
            repo_root: '/tmp/repo',
          },
        },
        null,
        2
      )
    );

    const report = buildLegacyParityReport({
      legacyPath,
      enterprisePath,
    });

    assert.equal(report.dominance, 'PASS');
    assert.equal(report.ruleDominance, 'PASS');
    assert.equal(report.severity.hardBlock, false);
    assert.equal(report.totals.failedRules, 0);
    const markdown = formatLegacyParityReportMarkdown(report);
    assert.match(markdown, /Legacy Parity Dominance Report/);
    assert.match(markdown, /dominance: PASS/);
    assert.match(markdown, /hard_block_by_severity: NO/);
    assert.match(markdown, /strict_scope: ENABLED/);
    assert.match(markdown, /\| ios \| skills\.ios\.no-force-unwrap \| 1 \| 2 \| PASS \|/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('buildLegacyParityReport falla en modo estricto cuando stage/repo/scope no coinciden', () => {
  const dir = createFixtureDir();
  try {
    const legacyPath = join(dir, 'legacy.json');
    const enterprisePath = join(dir, 'enterprise.json');

    writeFileSync(
      legacyPath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            files_scanned: 10,
            findings: [{ ruleId: 'skills.backend.no-empty-catch', severity: 'HIGH', file: 'apps/backend/src/a.ts' }],
          },
          repo_state: {
            repo_root: '/tmp/repo-a',
          },
        },
        null,
        2
      )
    );
    writeFileSync(
      enterprisePath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_PUSH',
            files_scanned: 11,
            findings: [{ ruleId: 'skills.backend.no-empty-catch', severity: 'HIGH', file: 'apps/backend/src/a.ts' }],
          },
          repo_state: {
            repo_root: '/tmp/repo-b',
          },
        },
        null,
        2
      )
    );

    assert.throws(
      () =>
        buildLegacyParityReport({
          legacyPath,
          enterprisePath,
        }),
      /Scope mismatch/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('buildLegacyParityReport permite mismatch de scope cuando strictScope=false', () => {
  const dir = createFixtureDir();
  try {
    const legacyPath = join(dir, 'legacy.json');
    const enterprisePath = join(dir, 'enterprise.json');

    writeFileSync(
      legacyPath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            files_scanned: 10,
            findings: [{ ruleId: 'skills.backend.no-empty-catch', severity: 'HIGH', file: 'apps/backend/src/a.ts' }],
          },
          repo_state: {
            repo_root: '/tmp/repo-a',
          },
        },
        null,
        2
      )
    );
    writeFileSync(
      enterprisePath,
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_PUSH',
            files_scanned: 11,
            findings: [{ ruleId: 'skills.backend.no-empty-catch', severity: 'HIGH', file: 'apps/backend/src/a.ts' }],
          },
          repo_state: {
            repo_root: '/tmp/repo-b',
          },
        },
        null,
        2
      )
    );

    const report = buildLegacyParityReport({
      legacyPath,
      enterprisePath,
      strictScope: false,
    });

    assert.equal(report.scope.strict, false);
    assert.equal(report.scope.matches.stage, false);
    assert.equal(report.scope.matches.filesScanned, false);
    assert.equal(report.scope.matches.repoRoot, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
