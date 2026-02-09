import assert from 'node:assert/strict';
import test from 'node:test';
import { buildConsumerCiArtifactsReportMarkdown } from '../collect-consumer-ci-artifacts-markdown-lib';

test('buildConsumerCiArtifactsReportMarkdown renders run table and artifact details', () => {
  const markdown = buildConsumerCiArtifactsReportMarkdown({
    options: {
      repo: 'org/repo',
      limit: 20,
      outFile: 'report.md',
    },
    generatedAt: '2026-02-09T00:00:00.000Z',
    runArtifactsResults: [
      {
        run: {
          databaseId: 11,
          displayTitle: 'ci run',
          workflowName: 'Pumuki CI',
          status: 'completed',
          conclusion: 'success',
          url: 'https://github.com/org/repo/actions/runs/11',
          createdAt: '2026-02-09T00:00:00.000Z',
          event: 'push',
          headBranch: 'main',
          headSha: 'abc123',
        },
        artifacts: {
          total_count: 1,
          artifacts: [
            {
              id: 99,
              name: 'ai-evidence',
              size_in_bytes: 1_048_576,
              archive_download_url:
                'https://github.com/org/repo/actions/runs/11/artifacts/99',
              expired: false,
              expires_at: '2026-03-01T00:00:00.000Z',
            },
          ],
        },
        errorLabel: '',
      },
    ],
  });

  assert.match(markdown, /# Consumer CI Artifact Report/);
  assert.match(markdown, /runs_checked: 1/);
  assert.match(markdown, /\| 11 \| Pumuki CI \| push \| main \| completed \| success \| 1 \|/);
  assert.match(markdown, /artifact `ai-evidence` id=99 size_mb=1.00/);
  assert.match(markdown, /download_url: https:\/\/github\.com\/org\/repo\/actions\/runs\/11\/artifacts\/99/);
});

test('buildConsumerCiArtifactsReportMarkdown renders startup failure fallback details', () => {
  const markdown = buildConsumerCiArtifactsReportMarkdown({
    options: {
      repo: 'org/repo',
      limit: 20,
      outFile: 'report.md',
    },
    generatedAt: '2026-02-09T00:00:00.000Z',
    runArtifactsResults: [
      {
        run: {
          databaseId: 17,
          displayTitle: 'failed startup',
          workflowName: '',
          status: 'completed',
          conclusion: 'startup_failure',
          url: 'https://github.com/org/repo/actions/runs/17',
          createdAt: '2026-02-09T00:00:00.000Z',
          event: 'pull_request',
          headBranch: 'feature/x',
          headSha: 'def456',
        },
        metadata: {
          id: 17,
          name: 'Consumer Startup',
          path: '.github/workflows/consumer.yml',
          status: 'completed',
          conclusion: 'startup_failure',
          html_url: 'https://github.com/org/repo/actions/runs/17',
          created_at: '2026-02-09T00:00:00.000Z',
          updated_at: '2026-02-09T00:00:00.000Z',
          referenced_workflows: ['x', 'y'],
        },
        artifacts: {
          total_count: 0,
          artifacts: [],
        },
        errorLabel: '',
      },
    ],
  });

  assert.match(markdown, /startup_failure_runs: 1/);
  assert.match(markdown, /startup_failure details: path=`\.github\/workflows\/consumer\.yml` referenced_workflows=2/);
});
