import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const SCRIPT_PATH = resolve(
  process.cwd(),
  'scripts/build-consumer-startup-failure-support-bundle.ts'
);

const writeMockGh = (
  binDir: string,
  options: {
    visibility?: 'public' | 'private';
    isPrivate?: boolean;
    runConclusion?: string;
  } = {}
): void => {
  const visibility = options.visibility ?? 'private';
  const isPrivate = options.isPrivate ?? true;
  const runConclusion = options.runConclusion ?? 'startup_failure';
  const ghPath = join(binDir, 'gh');
  writeFileSync(
    ghPath,
    `#!/usr/bin/env bash
set -eu

if [ "\${1:-}" = "auth" ] && [ "\${2:-}" = "status" ]; then
  cat <<'EOF'
github.com
  ✓ Logged in to github.com account mock-user (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_mock
  - Token scopes: 'repo', 'workflow'
EOF
  exit 0
fi

if [ "\${1:-}" = "run" ] && [ "\${2:-}" = "list" ]; then
  cat <<'EOF'
[{"databaseId":123,"workflowName":"","status":"completed","conclusion":"${runConclusion}","url":"https://example.local/runs/123","event":"push","createdAt":"2026-02-08T00:00:00.000Z","headBranch":"main","headSha":"abc123"}]
EOF
  exit 0
fi

if [ "\${1:-}" = "api" ]; then
  endpoint="\${2:-}"
  case "\${endpoint}" in
    "repos/owner/repo")
      echo '{"full_name":"owner/repo","private":${isPrivate},"visibility":"${visibility}"}'
      exit 0
      ;;
    "repos/owner/repo/actions/permissions")
      echo '{"enabled":true,"allowed_actions":"all","sha_pinning_required":false}'
      exit 0
      ;;
    "users/owner/settings/billing/actions")
      if [ "\${GH_BILLING_MODE:-ok}" = "error" ]; then
        echo '{"message":"Not Found"}' >&2
        echo 'gh: This API operation needs the "user" scope. To request it, run: gh auth refresh -h github.com -s user' >&2
        exit 1
      fi
      echo '{"included_minutes":3000,"minutes_used":124}'
      exit 0
      ;;
    "repos/owner/repo/actions/runs/123")
      echo '{"id":123,"name":"BuildFailed","path":"BuildFailed","status":"completed","conclusion":"${runConclusion}","html_url":"https://example.local/runs/123","referenced_workflows":[]}'
      exit 0
      ;;
    "repos/owner/repo/actions/runs/123/jobs")
      if [ "${runConclusion}" = "startup_failure" ]; then
        echo '{"total_count":0}'
      else
        echo '{"total_count":2}'
      fi
      exit 0
      ;;
    "repos/owner/repo/actions/runs/123/artifacts")
      if [ "${runConclusion}" = "startup_failure" ]; then
        echo '{"total_count":0}'
      else
        echo '{"total_count":1}'
      fi
      exit 0
      ;;
    *)
      echo "unsupported api endpoint: \${endpoint}" >&2
      exit 1
      ;;
  esac
fi

echo "unsupported gh invocation: $*" >&2
exit 1
`,
    'utf8'
  );
  chmodSync(ghPath, 0o755);
};

const runBundle = (params: {
  tempRoot: string;
  billingMode: 'ok' | 'error';
  visibility?: 'public' | 'private';
  isPrivate?: boolean;
  runConclusion?: string;
}): string => {
  const binDir = join(params.tempRoot, 'bin');
  mkdirSync(binDir, { recursive: true });
  writeMockGh(binDir, {
    visibility: params.visibility,
    isPrivate: params.isPrivate,
    runConclusion: params.runConclusion,
  });

  const outputPath = join(params.tempRoot, 'support-bundle.md');
  const envPath = `${binDir}:${process.env.PATH ?? ''}`;

  execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      SCRIPT_PATH,
      '--repo',
      'owner/repo',
      '--limit',
      '1',
      '--out',
      outputPath,
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: envPath,
        GH_BILLING_MODE: params.billingMode,
      },
      stdio: 'pipe',
    }
  );

  return readFileSync(outputPath, 'utf8');
};

test('support bundle includes repository policy and billing payload when available', async () => {
  await withTempDir('pumuki-support-bundle-ok-', async (tempRoot) => {
    const report = runBundle({
      tempRoot,
      billingMode: 'ok',
    });

    assert.match(report, /## Repository Actions Policy/);
    assert.match(report, /- enabled: true/);
    assert.match(report, /- allowed_actions: all/);
    assert.match(report, /- startup_stalled_runs: 0/);
    assert.match(report, /- oldest_queued_run_age_minutes: unknown/);
    assert.match(report, /## Billing Scope Probe/);
    assert.match(report, /"included_minutes": 3000/);
    assert.match(report, /oldest_queued_run_age_minutes: unknown/);
  });
});

test('support bundle documents billing scope remediation when billing probe fails', async () => {
  await withTempDir('pumuki-support-bundle-error-', async (tempRoot) => {
    const report = runBundle({
      tempRoot,
      billingMode: 'error',
    });

    assert.match(report, /## Billing Scope Probe/);
    assert.match(
      report,
      /gh auth refresh -h github\.com -s user/
    );
    assert.match(report, /- remediation:/);
  });
});

test('support bundle payload stays neutral for public repos without startup_failure runs', async () => {
  await withTempDir('pumuki-support-bundle-public-', async (tempRoot) => {
    const report = runBundle({
      tempRoot,
      billingMode: 'ok',
      visibility: 'public',
      isPrivate: false,
      runConclusion: 'success',
    });

    assert.match(
      report,
      /No startup_failure runs were observed in the sampled workflow runs for this public repository/
    );
    assert.match(
      report,
      /The current support bundle does not show startup_failure runs in the sampled evidence window/
    );
    assert.doesNotMatch(report, /Persistent GitHub Actions startup_failure in private repository/);
  });
});
