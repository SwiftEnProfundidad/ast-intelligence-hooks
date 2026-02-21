import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import packlist from 'npm-packlist';
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

const createDefaultDeps = (): CheckDeps => ({
  cwd: process.cwd(),
  readTextFile: (path, encoding) => readFileSync(path, encoding),
  listPackFiles: (cwd) =>
    packlist({
      path: cwd,
    }),
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
