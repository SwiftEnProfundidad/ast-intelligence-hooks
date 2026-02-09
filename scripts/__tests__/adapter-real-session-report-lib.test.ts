import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdapterRealSessionReportMarkdown,
  parseAdapterRealSessionArgs,
  parseAdapterRealSessionStatusReport,
} from '../adapter-real-session-report-lib';

test('parseAdapterRealSessionArgs provides deterministic defaults', () => {
  const parsed = parseAdapterRealSessionArgs([]);

  assert.equal(parsed.outFile, '.audit-reports/adapter/adapter-real-session-report.md');
  assert.equal(parsed.statusReportFile, '.audit-reports/adapter/adapter-session-status.md');
  assert.equal(parsed.operator, 'unknown');
  assert.equal(parsed.adapterVersion, 'unknown');
  assert.equal(parsed.tailLines, 120);
});

test('parseAdapterRealSessionStatusReport extracts command exit codes and pass signals', () => {
  const parsed = parseAdapterRealSessionStatusReport([
    '- verdict: PASS',
    '| verify-adapter-hooks-runtime | `npm run verify:adapter-hooks-runtime` | 0 |',
    '| assess-adapter-hooks-session | `npm run assess:adapter-hooks-session` | 0 |',
    '| assess-adapter-hooks-session:any | `npm run assess:adapter-hooks-session:any` | 0 |',
    'assess-adapter-hooks-session',
    'session-assessment=PASS',
    'assess-adapter-hooks-session:any',
    'session-assessment=PASS',
  ].join('\n'));

  assert.equal(parsed.verdict, 'PASS');
  assert.equal(parsed.verifyExitCode, 0);
  assert.equal(parsed.strictExitCode, 0);
  assert.equal(parsed.anyExitCode, 0);
  assert.equal(parsed.strictAssessmentPass, true);
  assert.equal(parsed.anyAssessmentPass, true);
});

test('buildAdapterRealSessionReportMarkdown renders PASS outcome when strict runtime is healthy', () => {
  const markdown = buildAdapterRealSessionReportMarkdown({
    options: {
      outFile: '.audit-reports/adapter/adapter-real-session-report.md',
      statusReportFile: '.audit-reports/adapter/adapter-session-status.md',
      operator: 'qa',
      adapterVersion: '1.0.0',
      tailLines: 50,
    },
    nowIso: '2026-02-09T00:00:00.000Z',
    branch: 'enterprise-refactor',
    repository: 'git@github.com:org/repo.git',
    nodeRuntime: 'v20.0.0',
    hookConfigPath: '~/.codeium/adapter/hooks.json',
    hookConfigContent: '{"hooks":{}}',
    statusReportPath: '.audit-reports/adapter/adapter-session-status.md',
    statusReport: '- verdict: PASS',
    parsedStatus: {
      verdict: 'PASS',
      verifyExitCode: 0,
      strictExitCode: 0,
      anyExitCode: 0,
      strictAssessmentPass: true,
      anyAssessmentPass: true,
    },
    runtimeLogPath: '.audit_tmp/cascade-hook-runtime-1.log',
    runtimeLogContent: 'node_bin=/usr/local/bin/node\npre_write_code\npost_write_code',
    runtimeLogTail: 'node_bin=/usr/local/bin/node\npre_write_code\npost_write_code',
    smokeLogPath: '.audit_tmp/cascade-hook-smoke-1.log',
    smokeLogContent: 'pre_write_code\npost_write_code',
    smokeLogTail: 'pre_write_code\npost_write_code',
    hookLogPath: '.audit_tmp/cascade-hook.log',
    hookLogContent: 'ALLOWED:\nBLOCKED:',
    hookLogTail: 'ALLOWED:\nBLOCKED:',
    writesLogPath: '.audit_tmp/cascade-writes.log',
    writesLogContent: 'post_write_code',
    writesLogTail: 'post_write_code',
    hasRuntimeLog: true,
    hasSmokeLog: true,
    hasHookLog: true,
    hasWritesLog: true,
    hookConfigExists: true,
  });

  assert.match(markdown, /- Validation result: PASS/);
  assert.match(markdown, /- Re-test required: NO/);
  assert.match(markdown, /- `pre_write_code` event observed: YES/);
});
