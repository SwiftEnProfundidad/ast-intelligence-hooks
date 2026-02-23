import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listPackFilesWithNpmPackDryRun,
  parseNpmPackDryRunFiles,
  readPackageId,
  runPackDryRun,
  runPackageManifestCheck,
} from '../check-package-manifest';
import { REQUIRED_PACKAGE_PATHS } from '../package-manifest-lib';

test('readPackageId compone name@version desde package.json', () => {
  const id = readPackageId({
    cwd: '/tmp/repo',
    readTextFile: () => JSON.stringify({ name: 'pumuki', version: '1.2.3' }),
  });

  assert.equal(id, 'pumuki@1.2.3');
});

test('runPackDryRun construye payload con id y paths', async () => {
  const payload = await runPackDryRun({
    cwd: '/tmp/repo',
    readTextFile: () => JSON.stringify({ name: 'pumuki', version: '1.2.3' }),
    listPackFiles: async () => ['bin/pumuki.js', 'core/facts/index.ts'],
  });

  assert.equal(payload.id, 'pumuki@1.2.3');
  assert.deepEqual(payload.files, [
    { path: 'bin/pumuki.js' },
    { path: 'core/facts/index.ts' },
  ]);
});

test('runPackageManifestCheck emite salida en caso válido', async () => {
  const outputs: string[] = [];
  await runPackageManifestCheck({
    cwd: '/tmp/repo',
    readTextFile: () => JSON.stringify({ name: 'pumuki', version: '1.2.3' }),
    listPackFiles: async () => [...REQUIRED_PACKAGE_PATHS],
    writeStdout: (message) => outputs.push(message),
    writeStderr: () => {},
  });

  assert.deepEqual(outputs, [
    'package manifest check passed for pumuki@1.2.3\n',
    `files scanned: ${REQUIRED_PACKAGE_PATHS.length}\n`,
  ]);
});

test('runPackageManifestCheck falla cuando faltan rutas requeridas', async () => {
  await assert.rejects(
    () =>
      runPackageManifestCheck({
        cwd: '/tmp/repo',
        readTextFile: () => JSON.stringify({ name: 'pumuki', version: '1.2.3' }),
        listPackFiles: async () => ['bin/pumuki.js'],
        writeStdout: () => {},
        writeStderr: () => {},
      }),
    /Package manifest is missing required paths/
  );
});

test('runPackageManifestCheck falla cuando hay rutas prohibidas', async () => {
  await assert.rejects(
    () =>
      runPackageManifestCheck({
        cwd: '/tmp/repo',
        readTextFile: () => JSON.stringify({ name: 'pumuki', version: '1.2.3' }),
        listPackFiles: async () => [...REQUIRED_PACKAGE_PATHS, 'legacy/file.ts'],
        writeStdout: () => {},
        writeStderr: () => {},
      }),
    /Package manifest includes forbidden paths/
  );
});

test('parseNpmPackDryRunFiles extrae rutas del payload json', () => {
  const paths = parseNpmPackDryRunFiles(
    JSON.stringify([
      {
        files: [{ path: 'bin/pumuki.js' }, { path: 'integrations/lifecycle/cli.ts' }],
      },
    ])
  );

  assert.deepEqual(paths, ['bin/pumuki.js', 'integrations/lifecycle/cli.ts']);
});

test('parseNpmPackDryRunFiles falla con payload sin files', () => {
  assert.throws(
    () => parseNpmPackDryRunFiles(JSON.stringify([{ id: 'pkg@1.0.0' }])),
    /does not include files/
  );
});

test('listPackFilesWithNpmPackDryRun devuelve listado real de paquete', () => {
  const paths = listPackFilesWithNpmPackDryRun(process.cwd());
  assert.ok(paths.includes('package.json'));
  assert.ok(paths.includes('integrations/lifecycle/cli.ts'));
});
