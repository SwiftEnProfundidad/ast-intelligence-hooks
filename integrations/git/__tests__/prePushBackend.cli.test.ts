import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('prePushBackend.cli delega en runCliCommand con runPrePushBackend', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/prePushBackend.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runPrePushBackend\s*\}\s+from\s+'\.\/prePushBackend';/
  );
  assert.match(source, /runCliCommand\(\s*runPrePushBackend\s*\);/);
});
