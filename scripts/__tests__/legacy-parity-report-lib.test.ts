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
            findings: [
              { ruleId: 'skills.backend.no-empty-catch', file: 'apps/backend/src/a.ts' },
              { ruleId: 'skills.backend.no-empty-catch', file: 'apps/backend/src/b.ts' },
            ],
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
            findings: [{ ruleId: 'skills.backend.no-empty-catch', file: 'apps/backend/src/a.ts' }],
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
            findings: [{ ruleId: 'skills.ios.no-force-unwrap', file: 'apps/ios/MainView.swift' }],
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
            findings: [
              { ruleId: 'skills.ios.no-force-unwrap', file: 'apps/ios/MainView.swift' },
              { ruleId: 'skills.ios.no-force-unwrap', file: 'apps/ios/DetailView.swift' },
            ],
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
    assert.equal(report.totals.failedRules, 0);
    const markdown = formatLegacyParityReportMarkdown(report);
    assert.match(markdown, /Legacy Parity Dominance Report/);
    assert.match(markdown, /dominance: PASS/);
    assert.match(markdown, /\| ios \| skills\.ios\.no-force-unwrap \| 1 \| 2 \| PASS \|/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
