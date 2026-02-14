import assert from 'node:assert/strict';
import test from 'node:test';
import { buildConsumerWorkflowLintMarkdown } from '../consumer-workflow-lint-markdown-lib';

test('buildConsumerWorkflowLintMarkdown renders deterministic raw output section', () => {
  const markdown = buildConsumerWorkflowLintMarkdown({
    generatedAtIso: '2026-02-09T00:00:00.000Z',
    options: {
      repoPath: '/tmp/repo',
      outFile: '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
      actionlintBin: 'actionlint',
    },
    lintResult: {
      exitCode: 1,
      output: 'line 1\nline 2',
      workflowPath: '/tmp/repo/.github/workflows/*.{yml,yaml}',
    },
  });

  assert.match(markdown, /generated_at: 2026-02-09T00:00:00.000Z/);
  assert.match(markdown, /exit_code: 1/);
  assert.match(markdown, /## Raw Output/);
  assert.match(markdown, /line 1/);
});

test('buildConsumerWorkflowLintMarkdown renders no-issues result when output is empty', () => {
  const markdown = buildConsumerWorkflowLintMarkdown({
    generatedAtIso: '2026-02-09T00:00:00.000Z',
    options: {
      repoPath: '/tmp/repo',
      outFile: '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
      actionlintBin: 'actionlint',
    },
    lintResult: {
      exitCode: 0,
      output: '',
      workflowPath: '/tmp/repo/.github/workflows/*.{yml,yaml}',
    },
  });

  assert.match(markdown, /## Result/);
  assert.match(markdown, /No issues reported by actionlint/);
});
