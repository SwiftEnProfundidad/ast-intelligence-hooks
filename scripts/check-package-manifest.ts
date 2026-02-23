import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { inspectPackageManifestPaths } from './package-manifest-lib';

export type PackFile = {
  path: string;
};

export type PackPayload = {
  id: string;
  files: PackFile[];
};

type PackageJson = {
  name?: string;
  version?: string;
};

type ReadTextFile = (path: string, encoding: BufferEncoding) => string;

type CheckDeps = {
  cwd: string;
  readTextFile: ReadTextFile;
  listPackFiles: (cwd: string) => Promise<ReadonlyArray<string>>;
  writeStdout: (message: string) => void;
  writeStderr: (message: string) => void;
};

type NpmPackDryRunFile = {
  path?: string;
};

type NpmPackDryRunPayload = {
  files?: NpmPackDryRunFile[];
};

const parseNpmPackDryRunFiles = (stdout: string): ReadonlyArray<string> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error('npm pack --json --dry-run returned invalid JSON output');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('npm pack --json --dry-run returned an empty payload');
  }

  const entry = parsed[0] as NpmPackDryRunPayload;
  if (!Array.isArray(entry.files)) {
    throw new Error('npm pack --json --dry-run payload does not include files');
  }

  return entry.files
    .map((file) => (typeof file.path === 'string' ? file.path : ''))
    .filter((path) => path.length > 0);
};

const listPackFilesWithNpmPackDryRun = (cwd: string): ReadonlyArray<string> => {
  const result = spawnSync('npm', ['pack', '--json', '--dry-run'], {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
  const exitCode =
    typeof result.status === 'number'
      ? result.status
      : result.error
        ? 1
        : 0;
  if (exitCode !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    throw new Error(
      `npm pack --json --dry-run failed with exit code ${exitCode}${output.length > 0 ? `\n${output}` : ''}`
    );
  }

  return parseNpmPackDryRunFiles(result.stdout ?? '');
};

const createDefaultDeps = (): CheckDeps => ({
  cwd: process.cwd(),
  readTextFile: (path, encoding) => readFileSync(path, encoding),
  listPackFiles: async (cwd) => listPackFilesWithNpmPackDryRun(cwd),
  writeStdout: (message) => {
    process.stdout.write(message);
  },
  writeStderr: (message) => {
    process.stderr.write(message);
  },
});

export const readPackageId = (deps: Pick<CheckDeps, 'cwd' | 'readTextFile'>): string => {
  const packageJsonPath = resolve(deps.cwd, 'package.json');
  const raw = deps.readTextFile(packageJsonPath, 'utf8');
  const parsed = JSON.parse(raw) as PackageJson;
  const name = parsed.name?.trim();
  const version = parsed.version?.trim();
  if (!name || !version) {
    return 'package@unknown';
  }
  return `${name}@${version}`;
};

export { parseNpmPackDryRunFiles, listPackFilesWithNpmPackDryRun };

export const runPackDryRun = async (deps: Pick<CheckDeps, 'cwd' | 'readTextFile' | 'listPackFiles'>): Promise<PackPayload> => {
  const files = await deps.listPackFiles(deps.cwd);

  return {
    id: readPackageId(deps),
    files: files.map((path) => ({ path })),
  };
};

export const runPackageManifestCheck = async (
  partialDeps?: Partial<CheckDeps>
): Promise<void> => {
  const deps = {
    ...createDefaultDeps(),
    ...partialDeps,
  } as CheckDeps;

  const payload = await runPackDryRun(deps);
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

  deps.writeStdout(`package manifest check passed for ${payload.id}\n`);
  deps.writeStdout(`files scanned: ${filePaths.length}\n`);
};

if (require.main === module) {
  void runPackageManifestCheck().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unexpected package manifest error';
    createDefaultDeps().writeStderr(`${message}\n`);
    process.exitCode = 1;
  });
}
