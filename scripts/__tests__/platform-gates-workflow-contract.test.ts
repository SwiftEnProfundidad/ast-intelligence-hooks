import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const readWorkflow = (name: string): string =>
  readFileSync(resolve(process.cwd(), `.github/workflows/${name}`), 'utf8');

test('ios gate workflow points runner_path to cli entrypoint', () => {
  const workflow = readWorkflow('pumuki-ios.yml');
  assert.match(workflow, /runner_path:\s*integrations\/git\/ciIOS\.cli\.ts/);
});

test('android gate workflow points runner_path to cli entrypoint', () => {
  const workflow = readWorkflow('pumuki-android.yml');
  assert.match(workflow, /runner_path:\s*integrations\/git\/ciAndroid\.cli\.ts/);
});

test('backend gate workflow points runner_path to cli entrypoint', () => {
  const workflow = readWorkflow('pumuki-backend.yml');
  assert.match(workflow, /runner_path:\s*integrations\/git\/ciBackend\.cli\.ts/);
});

test('frontend gate workflow points runner_path to cli entrypoint', () => {
  const workflow = readWorkflow('pumuki-frontend.yml');
  assert.match(workflow, /runner_path:\s*integrations\/git\/ciFrontend\.cli\.ts/);
});
