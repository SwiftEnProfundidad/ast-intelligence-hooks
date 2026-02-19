import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('ciFrontend.cli delega en runCliCommand con runCiFrontend', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/ciFrontend.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runCiFrontend\s*\}\s+from\s+'\.\/ciFrontend';/
  );
  assert.match(source, /runCliCommand\(\s*runCiFrontend\s*\);/);
});
