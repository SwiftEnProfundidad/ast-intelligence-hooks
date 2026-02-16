import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('ciBackend.cli delega en runCliCommand con runCiBackend', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/ciBackend.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runCiBackend\s*\}\s+from\s+'\.\/ciBackend';/
  );
  assert.match(source, /runCliCommand\(\s*runCiBackend\s*\);/);
});
