import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('ciAndroid.cli delega en runCliCommand con runCiAndroid', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/ciAndroid.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runCiAndroid\s*\}\s+from\s+'\.\/ciAndroid';/
  );
  assert.match(source, /runCliCommand\(\s*runCiAndroid\s*\);/);
});
