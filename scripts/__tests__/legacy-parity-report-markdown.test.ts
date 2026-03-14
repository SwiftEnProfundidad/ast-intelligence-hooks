import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLegacyParityReport,
  formatLegacyParityReportMarkdown,
} from '../legacy-parity-report-lib';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const createFixtureDir = (): string => {
  return mkdtempSync(join(tmpdir(), 'pumuki-legacy-parity-md-'));
};

test('formatLegacyParityReportMarkdown renderiza cabecera, scope y matriz de reglas', () => {
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
    const markdown = formatLegacyParityReportMarkdown(report);

    assert.match(markdown, /Legacy Parity Dominance Report/);
    assert.match(markdown, /dominance: PASS/);
    assert.match(markdown, /hard_block_by_severity: NO/);
    assert.match(markdown, /strict_scope: ENABLED/);
    assert.match(markdown, /\| severity \| legacy \| enterprise \| dominance \|/);
    assert.match(markdown, /\| ios \| skills\.ios\.no-force-unwrap \| 1 \| 2 \| PASS \|/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
