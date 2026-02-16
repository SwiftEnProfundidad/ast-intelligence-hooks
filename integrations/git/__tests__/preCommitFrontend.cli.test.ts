import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('preCommitFrontend.cli delega en runCliCommand con runPreCommitFrontend', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/preCommitFrontend.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runPreCommitFrontend\s*\}\s+from\s+'\.\/preCommitFrontend';/
  );
  assert.match(source, /runCliCommand\(\s*runPreCommitFrontend\s*\);/);
});
