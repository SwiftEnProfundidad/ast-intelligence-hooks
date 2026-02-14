import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMockConsumerStartupTriageArgs } from '../mock-consumer-startup-triage-cli-lib';
import {
  buildMockConsumerTriageMarkdown,
  buildMockConsumerUnblockMarkdown,
} from '../mock-consumer-startup-triage-lib';

test('parseMockConsumerStartupTriageArgs provides deterministic defaults', () => {
  const parsed = parseMockConsumerStartupTriageArgs([]);

  assert.equal(parsed.repo, 'owner/repo');
  assert.equal(parsed.outDir, '.audit-reports/phase5');
  assert.equal(parsed.blockSummaryFile, '.audit-reports/package-smoke/block/summary.md');
});

test('buildMockConsumerTriageMarkdown returns READY when all assessments pass', () => {
  const result = buildMockConsumerTriageMarkdown({
    generatedAt: '2026-02-09T00:00:00.000Z',
    repo: 'owner/repo',
    outDir: '.audit-reports/phase5',
    assessments: [
      {
        mode: 'block',
        file: 'block.md',
        exists: true,
        status: 'PASS',
        preCommitExit: 1,
        preCommitOutcome: 'BLOCK',
        prePushExit: 1,
        prePushOutcome: 'BLOCK',
        ciExit: 1,
        ciOutcome: 'BLOCK',
      },
      {
        mode: 'minimal',
        file: 'minimal.md',
        exists: true,
        status: 'PASS',
        preCommitExit: 0,
        preCommitOutcome: 'PASS',
        prePushExit: 0,
        prePushOutcome: 'PASS',
        ciExit: 0,
        ciOutcome: 'PASS',
      },
    ],
  });

  assert.equal(result.verdict, 'READY');
  assert.equal(result.failedSteps.length, 0);
});

test('buildMockConsumerUnblockMarkdown returns BLOCKED when triage is blocked', () => {
  const result = buildMockConsumerUnblockMarkdown({
    generatedAt: '2026-02-09T00:00:00.000Z',
    repo: 'owner/repo',
    triageReportPath: '.audit-reports/phase5/consumer-startup-triage-report.md',
    blockSummaryFile: '.audit-reports/package-smoke/block/summary.md',
    minimalSummaryFile: '.audit-reports/package-smoke/minimal/summary.md',
    triageVerdict: 'BLOCKED',
  });

  assert.equal(result.verdict, 'BLOCKED');
  assert.match(result.markdown, /Resolve mock package smoke failures/);
});
