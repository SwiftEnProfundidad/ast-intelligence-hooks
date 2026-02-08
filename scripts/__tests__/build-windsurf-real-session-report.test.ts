import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const generatorScriptPath = resolve(
  process.cwd(),
  'scripts/build-windsurf-real-session-report.ts'
);

const runGenerator = (params: {
  cwd: string;
  homeDir: string;
  statusReportFile: string;
  outFile: string;
}): void => {
  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      generatorScriptPath,
      '--status-report',
      params.statusReportFile,
      '--out',
      params.outFile,
    ],
    {
      cwd: params.cwd,
      env: {
        ...process.env,
        HOME: params.homeDir,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    }
  );
};

test('build-windsurf-real-session-report renders PASS when status and runtime signals are healthy', async () => {
  await withTempDir('pumuki-windsurf-real-pass-', (tempRoot) => {
    const docsValidation = join(tempRoot, 'docs/validation');
    const auditTmp = join(tempRoot, '.audit_tmp');
    const homeDir = join(tempRoot, 'home');
    const hookConfigDir = join(homeDir, '.codeium/windsurf');

    mkdirSync(docsValidation, { recursive: true });
    mkdirSync(auditTmp, { recursive: true });
    mkdirSync(hookConfigDir, { recursive: true });

    writeFileSync(
      join(hookConfigDir, 'hooks.json'),
      JSON.stringify(
        {
          hooks: {
            pre_write_code: 'run-hook-with-node.sh pre-write-code-hook.js',
            post_write_code: 'run-hook-with-node.sh post-write-code-hook.js',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    writeFileSync(
      join(docsValidation, 'windsurf-session-status.md'),
      [
        '# Windsurf Session Status Report',
        '',
        '- verdict: PASS',
        '',
        '## Commands',
        '',
        '| step | command | exit_code |',
        '| --- | --- | --- |',
        '| verify-windsurf-hooks-runtime | `npm run verify:windsurf-hooks-runtime` | 0 |',
        '| assess-windsurf-hooks-session | `npm run assess:windsurf-hooks-session` | 0 |',
        '| assess-windsurf-hooks-session:any | `npm run assess:windsurf-hooks-session:any` | 0 |',
        '',
        '## Command Output',
        '',
        '### assess-windsurf-hooks-session',
        '',
        '```text',
        'session-assessment=PASS',
        '```',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(auditTmp, 'cascade-hook-runtime-20260208.log'),
      [
        'node_bin=/usr/local/bin/node',
        'pre_write_code event captured',
        'post_write_code event captured',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(auditTmp, 'cascade-hook-smoke-20260208.log'),
      [
        'pre_write_code smoke',
        'post_write_code smoke',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(auditTmp, 'cascade-hook.log'),
      [
        '[2026-02-08T10:00:00Z] ALLOWED: check passed in apps/backend/src/example.ts',
        '[2026-02-08T10:00:10Z] BLOCKED: common.error.empty_catch in apps/backend/src/example.ts',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(auditTmp, 'cascade-writes.log'),
      JSON.stringify({
        event: 'post_write_code',
        file: 'apps/backend/src/example.ts',
      }),
      'utf8'
    );

    runGenerator({
      cwd: tempRoot,
      homeDir,
      statusReportFile: 'docs/validation/windsurf-session-status.md',
      outFile: 'docs/validation/windsurf-real-session-report.md',
    });

    const report = readFileSync(
      join(docsValidation, 'windsurf-real-session-report.md'),
      'utf8'
    );

    assert.match(report, /- Validation result: PASS/);
    assert.match(report, /- Re-test required: NO/);
    assert.match(report, /- `pre_write_code` event observed: YES/);
    assert.match(report, /- `post_write_code` event observed: YES/);
    assert.match(report, /- `npm run verify:windsurf-hooks-runtime`: PASS/);
    assert.match(report, /- Any `bash: node: command not found`: NO/);
    assert.match(report, /1\. Normal write action triggered in Windsurf: PASS/);
    assert.match(report, /2\. Blocked candidate write action triggered in Windsurf: PASS/);
  });
});

test('build-windsurf-real-session-report renders FAIL with node runtime root cause', async () => {
  await withTempDir('pumuki-windsurf-real-fail-', (tempRoot) => {
    const docsValidation = join(tempRoot, 'docs/validation');
    const auditTmp = join(tempRoot, '.audit_tmp');
    const homeDir = join(tempRoot, 'home');
    const hookConfigDir = join(homeDir, '.codeium/windsurf');

    mkdirSync(docsValidation, { recursive: true });
    mkdirSync(auditTmp, { recursive: true });
    mkdirSync(hookConfigDir, { recursive: true });

    writeFileSync(
      join(hookConfigDir, 'hooks.json'),
      JSON.stringify({ hooks: {} }, null, 2),
      'utf8'
    );

    writeFileSync(
      join(docsValidation, 'windsurf-session-status.md'),
      [
        '# Windsurf Session Status Report',
        '',
        '- verdict: BLOCKED',
        '',
        '## Commands',
        '',
        '| step | command | exit_code |',
        '| --- | --- | --- |',
        '| verify-windsurf-hooks-runtime | `npm run verify:windsurf-hooks-runtime` | 1 |',
        '| assess-windsurf-hooks-session | `npm run assess:windsurf-hooks-session` | 1 |',
        '| assess-windsurf-hooks-session:any | `npm run assess:windsurf-hooks-session:any` | 1 |',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(auditTmp, 'cascade-hook-runtime-20260209.log'),
      [
        'bash: node: command not found',
        'pre_write_code event captured',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(auditTmp, 'cascade-hook.log'),
      '[2026-02-09T10:00:00Z] BLOCKED: runtime error in apps/backend/src/example.ts',
      'utf8'
    );

    runGenerator({
      cwd: tempRoot,
      homeDir,
      statusReportFile: 'docs/validation/windsurf-session-status.md',
      outFile: 'docs/validation/windsurf-real-session-report.md',
    });

    const report = readFileSync(
      join(docsValidation, 'windsurf-real-session-report.md'),
      'utf8'
    );

    assert.match(report, /- Validation result: FAIL/);
    assert.match(report, /- Re-test required: YES/);
    assert.match(report, /- `npm run verify:windsurf-hooks-runtime`: FAIL/);
    assert.match(report, /- Any `bash: node: command not found`: YES/);
    assert.match(
      report,
      /Hook runtime shell cannot resolve Node binary \(`node: command not found`\)\./
    );
  });
});
