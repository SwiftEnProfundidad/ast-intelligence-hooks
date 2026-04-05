import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT_DIR = process.cwd();

type PackageJson = {
  version: string;
};

type PackageLockJson = {
  version?: string;
  packages?: Record<string, { version?: string }>;
};

const readJson = <T>(relativePath: string): T => {
  return JSON.parse(readFileSync(join(ROOT_DIR, relativePath), 'utf8')) as T;
};

const readText = (relativePath: string): string => {
  return readFileSync(join(ROOT_DIR, relativePath), 'utf8');
};

const extractChangelogVersion = (source: string): string | undefined => {
  const match = source.match(/^## \[(?!Unreleased\])([^\]]+)\]/m);
  return match?.[1];
};

const extractReleaseNotesVersion = (source: string): string | undefined => {
  const match = source.match(/^### \d{4}-\d{2}-\d{2} \(v(\d+\.\d+\.\d+)\)$/m);
  return match?.[1];
};

const extractTrackingFront = (source: string): string | undefined => {
  const match = source.match(/^- Frente activo: `([^`]+)`$/m);
  return match?.[1];
};

const extractTrackingPostReleaseVersion = (source: string): string | undefined => {
  const match = source.match(/POST-RELEASE (\d+\.\d+\.\d+)/);
  return match?.[1];
};

test('metadata local de release permanece alineada dentro de la rama actual', () => {
  const packageJson = readJson<PackageJson>('package.json');
  const packageLock = readJson<PackageLockJson>('package-lock.json');
  const changelogSource = readText('CHANGELOG.md');
  const releaseNotesSource = readText('docs/operations/RELEASE_NOTES.md');

  const packageVersion = packageJson.version;
  const packageLockVersion = packageLock.version;
  const packageLockRootVersion = packageLock.packages?.['']?.version;
  const changelogVersion = extractChangelogVersion(changelogSource);
  const releaseNotesVersion = extractReleaseNotesVersion(releaseNotesSource);

  assert.ok(packageVersion);
  assert.equal(packageLockVersion, packageVersion);
  assert.equal(packageLockRootVersion, packageVersion);
  assert.equal(changelogVersion, packageVersion);
  assert.equal(releaseNotesVersion, packageVersion);
});

test('tracking solo puede anunciar un POST-RELEASE distinto durante release-line-reconciliation', () => {
  const packageJson = readJson<PackageJson>('package.json');
  const trackingSource = readText('docs/tracking/plan-activo-de-trabajo.md');

  const activeFront = extractTrackingFront(trackingSource);
  const trackingPostReleaseVersion = extractTrackingPostReleaseVersion(trackingSource);

  assert.ok(activeFront);

  if (!trackingPostReleaseVersion) {
    return;
  }

  if (activeFront === 'release-line-reconciliation') {
    assert.notEqual(trackingPostReleaseVersion, packageJson.version);
    assert.match(trackingSource, /DRIFT DE RELEASE/);
    return;
  }

  assert.equal(trackingPostReleaseVersion, packageJson.version);
});
