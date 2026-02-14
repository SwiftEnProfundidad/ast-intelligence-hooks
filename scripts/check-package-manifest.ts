import { spawnSync } from 'node:child_process';
import { inspectPackageManifestPaths } from './package-manifest-lib';

type PackFile = {
  path: string;
};

type PackPayload = {
  id: string;
  files: PackFile[];
};

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
  const report = inspectPackageManifestPaths(filePaths);

  if (report.missingRequired.length > 0) {
    throw new Error(
      `Package manifest is missing required paths:\n- ${report.missingRequired.join('\n- ')}`
    );
  }

  if (report.forbiddenMatches.length > 0) {
    throw new Error(
      `Package manifest includes forbidden paths:\n- ${report.forbiddenMatches.join('\n- ')}`
    );
  }

  console.log(`package manifest check passed for ${payload.id}`);
  console.log(`files scanned: ${filePaths.length}`);
};

main();
