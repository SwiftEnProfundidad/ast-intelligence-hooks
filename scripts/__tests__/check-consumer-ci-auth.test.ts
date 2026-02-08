import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const SCRIPT_PATH = resolve(process.cwd(), 'scripts/check-consumer-ci-auth.ts');

const writeMockGh = (binDir: string): void => {
  const ghPath = join(binDir, 'gh');
  writeFileSync(
    ghPath,
    `#!/usr/bin/env bash
set -eu

if [ "\${1:-}" = "auth" ] && [ "\${2:-}" = "status" ]; then
  if [ "\${GH_AUTH_SCENARIO:-ready}" = "missing-user-scope" ]; then
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
  cat <<'EOF'
github.com
  ✓ Logged in to github.com account mock-user (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_mock
  - Token scopes: 'repo', 'workflow', 'user'
EOF
  exit 0
fi

if [ "\${1:-}" = "api" ]; then
  endpoint="\${2:-}"
  case "\${endpoint}" in
    "repos/owner/repo/actions/permissions")
      echo '{"enabled":true,"allowed_actions":"all","sha_pinning_required":false}'
      exit 0
      ;;
    "users/owner/settings/billing/actions")
      if [ "\${GH_AUTH_SCENARIO:-ready}" = "missing-user-scope" ]; then
        echo '{"message":"Not Found"}' >&2
        echo 'gh: This API operation needs the "user" scope. To request it, run: gh auth refresh -h github.com -s user' >&2
        exit 1
      fi
      echo '{"included_minutes":3000,"minutes_used":12}'
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

const runAuthCheck = (params: {
  tempRoot: string;
  scenario: 'ready' | 'missing-user-scope';
}): { report: string; exitCode: number } => {
  const binDir = join(params.tempRoot, 'bin');
  mkdirSync(binDir, { recursive: true });
  writeMockGh(binDir);

  const outputPath = join(params.tempRoot, 'auth-check.md');
  const envPath = `${binDir}:${process.env.PATH ?? ''}`;

  try {
    execFileSync(
      'npx',
      [
        '--yes',
        'tsx@4.21.0',
        SCRIPT_PATH,
        '--repo',
        'owner/repo',
        '--out',
        outputPath,
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PATH: envPath,
          GH_AUTH_SCENARIO: params.scenario,
        },
        stdio: 'pipe',
      }
    );
    return {
      report: readFileSync(outputPath, 'utf8'),
      exitCode: 0,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      return {
        report: readFileSync(outputPath, 'utf8'),
        exitCode: Number((error as { status?: number }).status ?? 1),
      };
    }
    throw error;
  }
};

test('auth check reports READY when required probes and scopes are available', async () => {
  await withTempDir('pumuki-auth-check-ready-', async (tempRoot) => {
    const result = runAuthCheck({
      tempRoot,
      scenario: 'ready',
    });

    assert.equal(result.exitCode, 0);
    assert.match(result.report, /- verdict: READY/);
    assert.match(result.report, /- missing_scopes: \(none\)/);
    assert.match(result.report, /"included_minutes": 3000/);
  });
});

test('auth check reports BLOCKED and remediation when user scope is missing', async () => {
  await withTempDir('pumuki-auth-check-blocked-', async (tempRoot) => {
    const result = runAuthCheck({
      tempRoot,
      scenario: 'missing-user-scope',
    });

    assert.equal(result.exitCode, 1);
    assert.match(result.report, /- verdict: BLOCKED/);
    assert.match(result.report, /- missing_scopes: user/);
    assert.match(result.report, /gh auth refresh -h github\.com -s user/);
  });
});
