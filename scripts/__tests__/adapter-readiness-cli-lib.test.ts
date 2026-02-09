import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  parseAdapterReadinessArgs,
  readAdapterReadinessInput,
} from '../adapter-readiness-cli-lib';

test('parseAdapterReadinessArgs applies deterministic defaults', () => {
  const parsed = parseAdapterReadinessArgs([]);

  assert.deepEqual(parsed, {
    adapterReportFile: '.audit-reports/adapter/adapter-real-session-report.md',
    outFile: '.audit-reports/adapter/adapter-readiness.md',
  });
});

test('parseAdapterReadinessArgs validates unknown arguments', () => {
  assert.throws(
    () => parseAdapterReadinessArgs(['--unknown']),
    /Unknown argument: --unknown/
  );
});

test('readAdapterReadinessInput returns missing and present states', async () => {
  await withTempDir('pumuki-adapter-readiness-cli-', (tempRoot) => {
    const missing = readAdapterReadinessInput(
      tempRoot,
      '.audit-reports/adapter/adapter-real-session-report.md'
    );
    assert.equal(missing.exists, false);

    const targetFile = join(
      tempRoot,
      '.audit-reports/adapter/adapter-real-session-report.md'
    );
    mkdirSync(join(tempRoot, '.audit-reports/adapter'), { recursive: true });
    writeFileSync(targetFile, '# report', 'utf8');

    const present = readAdapterReadinessInput(
      tempRoot,
      '.audit-reports/adapter/adapter-real-session-report.md'
    );
    assert.equal(present.exists, true);
    assert.equal(present.content, '# report');
  });
});
