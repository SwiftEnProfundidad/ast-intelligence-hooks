import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdapterSessionStatusMarkdown,
  deriveAdapterSessionVerdictFromCommands,
  exitCodeForAdapterSessionVerdict,
  filterHookLogLinesForRepo,
  filterWritesLogLinesForRepo,
  parseAdapterSessionStatusArgs,
} from '../adapter-session-status-report-lib';

test('parseAdapterSessionStatusArgs provides deterministic defaults', () => {
  const parsed = parseAdapterSessionStatusArgs([]);

  assert.equal(parsed.outFile, '.audit-reports/adapter/adapter-session-status.md');
  assert.equal(parsed.tailLines, 80);
});

test('deriveAdapterSessionVerdictFromCommands returns PASS when strict assessment passes', () => {
  const verdict = deriveAdapterSessionVerdictFromCommands([
    {
      label: 'verify-adapter-hooks-runtime',
      command: 'npm run verify:adapter-hooks-runtime',
      exitCode: 0,
      output: 'ok',
    },
    {
      label: 'assess-adapter-hooks-session',
      command: 'npm run assess:adapter-hooks-session',
      exitCode: 0,
      output: 'session-assessment=PASS',
    },
    {
      label: 'assess-adapter-hooks-session:any',
      command: 'npm run assess:adapter-hooks-session:any',
      exitCode: 0,
      output: 'session-assessment=FAIL',
    },
  ]);

  assert.equal(verdict, 'PASS');
  assert.equal(exitCodeForAdapterSessionVerdict(verdict), 0);
});

test('filterHookLogLinesForRepo keeps repo and simulated lines only', () => {
  const lines = filterHookLogLinesForRepo({
    repoRoot: '/repo',
    content: [
      '[2026-02-09] ANALYZING: /repo/apps/backend/src/main.ts (1 edits)',
      '[2026-02-09] BLOCKED: x in /tmp/outside.ts',
      '[2026-02-09] ALLOWED: y in apps/backend/src/example.ts',
      '[2026-02-09] event __pumuki_simulated__',
    ].join('\n'),
  });

  assert.equal(lines.length, 2);
  assert.equal(
    lines.some((line) => line.includes('apps/backend/src/example.ts')),
    true
  );
  assert.equal(
    lines.some((line) => line.includes('__pumuki_simulated__')),
    true
  );
});

test('filterWritesLogLinesForRepo keeps JSON lines inside repo root', () => {
  const lines = filterWritesLogLinesForRepo({
    repoRoot: '/repo',
    content: [
      JSON.stringify({ file: '/repo/apps/backend/src/main.ts' }),
      JSON.stringify({ file: '/tmp/outside.ts' }),
      '{"broken"',
    ].join('\n'),
  });

  assert.deepEqual(lines, [JSON.stringify({ file: '/repo/apps/backend/src/main.ts' })]);
});

test('buildAdapterSessionStatusMarkdown renders deterministic PASS summary', () => {
  const markdown = buildAdapterSessionStatusMarkdown({
    generatedAtIso: '2026-02-09T00:00:00.000Z',
    options: {
      outFile: '.audit-reports/adapter/adapter-session-status.md',
      tailLines: 80,
    },
    commands: [
      {
        label: 'verify-adapter-hooks-runtime',
        command: 'npm run verify:adapter-hooks-runtime',
        exitCode: 0,
        output: 'ok',
      },
    ],
    verdict: 'PASS',
    tails: [
      {
        title: 'cascade-hook.log',
        path: '/repo/.audit_tmp/cascade-hook.log',
        content: 'tail',
      },
    ],
  });

  assert.match(markdown, /- verdict: PASS/);
  assert.match(markdown, /## Interpretation/);
  assert.match(markdown, /Real Adapter pre\/post events are present/);
});
