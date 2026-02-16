import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('preCommitAndroid.cli delega en runCliCommand con runPreCommitAndroid', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/git/preCommitAndroid.cli.ts'),
    'utf8'
  );

  assert.match(
    source,
    /import\s+\{\s*runCliCommand\s*\}\s+from\s+'\.\/runCliCommand';/
  );
  assert.match(
    source,
    /import\s+\{\s*runPreCommitAndroid\s*\}\s+from\s+'\.\/preCommitAndroid';/
  );
  assert.match(source, /runCliCommand\(\s*runPreCommitAndroid\s*\);/);
});
