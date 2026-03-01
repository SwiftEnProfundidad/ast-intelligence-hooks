import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const scriptPath = resolve(process.cwd(), 'scripts/manage-library.sh');

const loadScript = (): string => readFileSync(scriptPath, 'utf8');

test('manage-library resolves PROJECT_ROOT to repository root (not scripts/)', () => {
  const script = loadScript();

  assert.match(
    script,
    /PROJECT_ROOT="\$\(cd "\$\(dirname "\$\{BASH_SOURCE\[0\]\}"\)\/\.\." && pwd\)"/
  );
  assert.match(script, /cd "\$PROJECT_ROOT"/);
});
