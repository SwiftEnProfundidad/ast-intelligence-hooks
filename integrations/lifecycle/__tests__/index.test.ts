import assert from 'node:assert/strict';
import test from 'node:test';
import * as lifecycle from '../index';
import { doctorHasBlockingIssues, runLifecycleDoctor } from '../doctor';
import { runLifecycleInstall } from '../install';
import { runLifecycleRemove } from '../remove';
import { readLifecycleStatus } from '../status';
import { runLifecycleUninstall } from '../uninstall';
import { runLifecycleUpdate } from '../update';

test('lifecycle index reexporta la API pública esperada', () => {
  assert.equal(lifecycle.runLifecycleDoctor, runLifecycleDoctor);
  assert.equal(lifecycle.doctorHasBlockingIssues, doctorHasBlockingIssues);
  assert.equal(lifecycle.runLifecycleInstall, runLifecycleInstall);
  assert.equal(lifecycle.runLifecycleUninstall, runLifecycleUninstall);
  assert.equal(lifecycle.runLifecycleRemove, runLifecycleRemove);
  assert.equal(lifecycle.runLifecycleUpdate, runLifecycleUpdate);
  assert.equal(lifecycle.readLifecycleStatus, readLifecycleStatus);
});

test('lifecycle index expone funciones ejecutables', () => {
  assert.equal(typeof lifecycle.runLifecycleDoctor, 'function');
  assert.equal(typeof lifecycle.doctorHasBlockingIssues, 'function');
  assert.equal(typeof lifecycle.runLifecycleInstall, 'function');
  assert.equal(typeof lifecycle.runLifecycleUninstall, 'function');
  assert.equal(typeof lifecycle.runLifecycleRemove, 'function');
  assert.equal(typeof lifecycle.runLifecycleUpdate, 'function');
  assert.equal(typeof lifecycle.readLifecycleStatus, 'function');
});
