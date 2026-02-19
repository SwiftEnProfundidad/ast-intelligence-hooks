import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('preCommitBackend.cli delega en runCliCommand con runPreCommitBackend', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/preCommitBackend.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runPreCommitBackend\s*\}\s+from\s+'\.\/preCommitBackend';/
  );
  assert.match(source, /runCliCommand\(\s*runPreCommitBackend\s*\);/);
});
