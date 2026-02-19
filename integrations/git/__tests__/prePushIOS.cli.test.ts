import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('prePushIOS.cli delega en runCliCommand con runPrePushIOS', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/prePushIOS.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runPrePushIOS\s*\}\s+from\s+'\.\/prePushIOS';/
  );
  assert.match(source, /runCliCommand\(\s*runPrePushIOS\s*\);/);
});
