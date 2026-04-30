import assert from 'node:assert/strict';
import { join } from 'node:path';
import {
  installedBinMarkerPath,
  resolveBinStrategy,
  resolveSmokeLayout,
} from '../pumuki-full-surface-smoke-lib';

const smokeScriptUrl = new URL('../pumuki-full-surface-smoke.ts', import.meta.url).href;

const testResolveBinStrategy = () => {
  assert.equal(resolveBinStrategy(undefined), 'source');
  assert.equal(resolveBinStrategy(''), 'source');
  assert.equal(resolveBinStrategy('  SOURCE  '), 'source');
  assert.equal(resolveBinStrategy('bogus'), 'source');
  assert.equal(resolveBinStrategy('installed'), 'installed');
  assert.equal(resolveBinStrategy('Consumer'), 'installed');
};

const testResolveSmokeLayoutDefaults = () => {
  const layout = resolveSmokeLayout({
    scriptFileUrl: smokeScriptUrl,
    env: {},
  });
  assert.equal(layout.binStrategy, 'source');
  assert.equal(layout.smokeCwd, layout.pumukiPackageRoot);
  assert.equal(layout.binRoot, layout.pumukiPackageRoot);
  const marker = installedBinMarkerPath(layout);
  assert.match(marker, /pumuki\.js$/);
};

const testResolveSmokeLayoutConsumerRoot = () => {
  const fakeRoot = join('/tmp', 'fake-consumer');
  const layout = resolveSmokeLayout({
    scriptFileUrl: smokeScriptUrl,
    env: { PUMUKI_SMOKE_REPO_ROOT: fakeRoot, PUMUKI_SMOKE_BIN_STRATEGY: 'installed' },
  });
  assert.equal(layout.smokeCwd, fakeRoot);
  assert.equal(layout.binStrategy, 'installed');
  assert.equal(layout.binRoot, join(fakeRoot, 'node_modules', 'pumuki'));
  assert.equal(installedBinMarkerPath(layout), join(fakeRoot, 'node_modules', 'pumuki', 'bin', 'pumuki.js'));
};

testResolveBinStrategy();
testResolveSmokeLayoutDefaults();
testResolveSmokeLayoutConsumerRoot();
