import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { resolveAdapterSessionStatusCommands } from '../adapter-session-status-capabilities-lib';

test('resolveAdapterSessionStatusCommands marks missing consumer scripts as unavailable', async () => {
  await withTempDir('pumuki-adapter-status-caps-empty-', (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify({ name: 'consumer-fixture', scripts: {} }, null, 2),
      'utf8'
    );

    const commands = resolveAdapterSessionStatusCommands(repoRoot);
    const unavailableLabels = commands
      .filter((command) => command.availability === 'unavailable')
      .map((command) => command.label);

    assert.deepEqual(unavailableLabels, [
      'collect-runtime-diagnostics',
      'verify-adapter-hooks-runtime',
      'assess-adapter-hooks-session',
      'assess-adapter-hooks-session:any',
    ]);
  });
});

test('resolveAdapterSessionStatusCommands treats deprecated verify alias as unavailable', async () => {
  await withTempDir('pumuki-adapter-status-caps-deprecated-', (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'consumer-fixture',
          scripts: {
            'verify:adapter-hooks-runtime':
              "echo 'Migrated to modern TS scripts — use validation:adapter-readiness instead'",
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const commands = resolveAdapterSessionStatusCommands(repoRoot);
    const verify = commands.find(
      (command) => command.label === 'verify-adapter-hooks-runtime'
    );

    assert.ok(verify);
    assert.equal(verify.availability, 'unavailable');
    assert.match(verify.unavailableReason ?? '', /deprecated verification alias/i);
  });
});

test('resolveAdapterSessionStatusCommands respects an explicit consumer verify script', async () => {
  await withTempDir('pumuki-adapter-status-caps-verify-', (repoRoot) => {
    mkdirSync(join(repoRoot, '.audit-reports'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'consumer-fixture',
          scripts: {
            'verify:adapter-hooks-runtime': 'node ./scripts/verify-adapter.js',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const commands = resolveAdapterSessionStatusCommands(repoRoot);
    const verify = commands.find(
      (command) => command.label === 'verify-adapter-hooks-runtime'
    );

    assert.ok(verify);
    assert.equal(verify.availability, 'available');
  });
});
