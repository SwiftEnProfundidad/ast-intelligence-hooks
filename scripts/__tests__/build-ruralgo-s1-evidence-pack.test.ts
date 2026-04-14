import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(process.cwd(), 'scripts/build-ruralgo-s1-evidence-pack.ts');

test('build-ruralgo-s1-evidence-pack genera paquete determinista para RuralGo', async () => {
  await withTempDir('pumuki-ruralgo-s1-evidence-pack-', (tempRoot) => {
    const stdout = execFileSync(
      'npx',
      [
        '--yes',
        'tsx@4.21.0',
        scriptPath,
        '--consumer-root',
        '/Users/example/R_GO',
        '--package-version',
        '6.3.71',
        '--generated-at',
        '2026-04-14T12:00:00.000Z',
        '--out',
        '.audit-reports/ruralgo-s1/evidence-pack.md',
      ],
      {
        cwd: tempRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      }
    );

    assert.match(stdout, /ruralgo s1 evidence pack generated at/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/ruralgo-s1/evidence-pack.md'),
      'utf8'
    );
    assert.match(report, /# RuralGo S1 Evidence Pack/);
    assert.match(report, /consumer_root: `\/Users\/example\/R_GO`/);
    assert.match(report, /package_version: 6.3.71/);
    assert.match(report, /cd \/Users\/example\/R_GO && npm run pumuki:status/);
    assert.match(
      report,
      /cd \/Users\/example\/R_GO && npx --yes --package pumuki@6\.3\.71 pumuki sdd validate --stage=PRE_WRITE --json/
    );
    assert.match(report, /mcp::pre_flight_check\(stage=PRE_WRITE\)/);
    assert.match(report, /PUMUKI-INC-071, PUMUKI-INC-073, PUMUKI-INC-076/);
    assert.match(report, /`PUMUKI-INC-072`: no cerrar salvo que el pre-edit gate aparezca de forma homogénea y automática/);
  });
});

test('build-ruralgo-s1-evidence-pack degrada a latest cuando package_version no es una semver publicada', async () => {
  await withTempDir('pumuki-ruralgo-s1-evidence-pack-', (tempRoot) => {
    execFileSync(
      'npx',
      [
        '--yes',
        'tsx@4.21.0',
        scriptPath,
        '--consumer-root',
        '/Users/example/R_GO',
        '--package-version',
        'local-refactor-s1',
        '--generated-at',
        '2026-04-14T12:00:00.000Z',
        '--out',
        '.audit-reports/ruralgo-s1/evidence-pack.md',
      ],
      {
        cwd: tempRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      }
    );

    const report = readFileSync(
      join(tempRoot, '.audit-reports/ruralgo-s1/evidence-pack.md'),
      'utf8'
    );
    assert.match(
      report,
      /cd \/Users\/example\/R_GO && npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json/
    );
  });
});
