import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('prePushFrontend.cli delega en runCliCommand con runPrePushFrontend', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/prePushFrontend.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runPrePushFrontend\s*\}\s+from\s+'\.\/prePushFrontend';/
  );
  assert.match(source, /runCliCommand\(\s*runPrePushFrontend\s*\);/);
});
