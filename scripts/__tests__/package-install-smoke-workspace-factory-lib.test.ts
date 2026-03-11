import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import {
  cleanupWorkspace,
  createSmokeWorkspace,
} from '../package-install-smoke-workspace-factory-lib';

test('createSmokeWorkspace usa ruta consumer robusta para paths con ":" en plataformas unix', () => {
  const workspace = createSmokeWorkspace('block');
  try {
    if (process.platform === 'win32') {
      assert.equal(workspace.consumerRepo.includes(':'), false);
    } else {
      assert.equal(workspace.consumerRepo.includes('consumer:repo'), true);
    }
    assert.equal(existsSync(workspace.tmpRoot), true);
  } finally {
    cleanupWorkspace(workspace);
  }
});
