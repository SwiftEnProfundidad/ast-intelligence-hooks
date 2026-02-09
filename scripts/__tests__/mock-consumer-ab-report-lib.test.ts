import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  assessEvidenceFile,
  buildMockConsumerAbMarkdown,
  parseMockConsumerAbArgs,
} from '../mock-consumer-ab-report-lib';

test('parseMockConsumerAbArgs provides deterministic defaults', () => {
  const parsed = parseMockConsumerAbArgs([]);

  assert.equal(parsed.repo, 'owner/repo');
  assert.equal(
    parsed.outFile,
    '.audit-reports/mock-consumer/mock-consumer-ab-report.md'
  );
  assert.equal(
    parsed.blockEvidenceFile,
    '.audit-reports/package-smoke/block/ci.ai_evidence.json'
  );
});

test('assessEvidenceFile reads v2.1 CI evidence payload', async () => {
  await withTempDir('pumuki-mock-evidence-', (tempRoot) => {
    const evidenceFile = join(tempRoot, 'evidence.json');
    writeFileSync(
      evidenceFile,
      JSON.stringify(
        {
          version: '2.1',
          snapshot: {
            stage: 'CI',
            outcome: 'PASS',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const currentCwd = process.cwd();
    process.chdir(tempRoot);
    try {
      const assessment = assessEvidenceFile('evidence.json');
      assert.equal(assessment.exists, true);
      assert.equal(assessment.version, '2.1');
      assert.equal(assessment.stage, 'CI');
      assert.equal(assessment.outcome, 'PASS');
    } finally {
      process.chdir(currentCwd);
    }
  });
});

test('buildMockConsumerAbMarkdown renders BLOCKED with explicit blockers', () => {
  const report = buildMockConsumerAbMarkdown({
    generatedAt: '2026-02-09T00:00:00.000Z',
    repo: 'owner/repo',
    blockSummaryFile: 'block.md',
    minimalSummaryFile: 'minimal.md',
    blockEvidenceFile: 'block.json',
    minimalEvidenceFile: 'minimal.json',
    blockReady: false,
    minimalReady: true,
    blockEvidence: {
      file: 'block.json',
      exists: false,
    },
    minimalEvidence: {
      file: 'minimal.json',
      exists: true,
      version: '2.1',
      stage: 'CI',
      outcome: 'PASS',
    },
  });

  assert.equal(report.verdict, 'BLOCKED');
  assert.match(report.markdown, /Package smoke block mode summary is not in expected blocking state/);
  assert.match(report.markdown, /block evidence file is missing/);
});
