import { spawnSync } from 'node:child_process';

type PackFile = {
  path: string;
};

type PackPayload = {
  id: string;
  files: PackFile[];
};

const REQUIRED_PATHS = [
  'bin/pumuki-framework.js',
  'bin/pumuki-pre-commit.js',
  'bin/pumuki-pre-push.js',
  'bin/pumuki-ci.js',
  'bin/pumuki-mcp-evidence.js',
  'scripts/package-install-smoke.ts',
  'integrations/git/runPlatformGate.ts',
  'integrations/evidence/buildEvidence.ts',
];

const FORBIDDEN_PATTERNS: RegExp[] = [
  /^legacy\//,
  /\/__tests__\//,
  /^docs\/validation\/archive\//,
  /^\.audit-reports\//,
  /^\.audit_tmp\//,
];

const runPackDryRun = (): PackPayload => {
  const result = spawnSync('npm', ['pack', '--json', '--dry-run'], {
    encoding: 'utf8',
  });

  if (typeof result.status !== 'number' || result.status !== 0) {
    throw new Error(`npm pack --json --dry-run failed:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  }

  const parsed = JSON.parse(result.stdout) as PackPayload[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('npm pack --json --dry-run returned an empty payload');
  }
  const payload = parsed[0];
  if (!payload || !Array.isArray(payload.files)) {
    throw new Error('npm pack --json --dry-run returned an invalid payload');
  }
  return payload;
};

const main = (): void => {
  const payload = runPackDryRun();
  const filePaths = payload.files.map((file) => file.path);

  const missingRequired = REQUIRED_PATHS.filter((requiredPath) => !filePaths.includes(requiredPath));
  if (missingRequired.length > 0) {
    throw new Error(`Package manifest is missing required paths:\n- ${missingRequired.join('\n- ')}`);
  }

  const forbiddenMatches = filePaths.filter((path) =>
    FORBIDDEN_PATTERNS.some((pattern) => pattern.test(path))
  );
  if (forbiddenMatches.length > 0) {
    throw new Error(`Package manifest includes forbidden paths:\n- ${forbiddenMatches.join('\n- ')}`);
  }

  console.log(`package manifest check passed for ${payload.id}`);
  console.log(`files scanned: ${filePaths.length}`);
};

main();
