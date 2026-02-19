import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('ciIOS.cli delega en runCliCommand con runCiIOS', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/ciIOS.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runCiIOS\s*\}\s+from\s+'\.\/ciIOS';/
  );
  assert.match(source, /runCliCommand\(\s*runCiIOS\s*\);/);
});
