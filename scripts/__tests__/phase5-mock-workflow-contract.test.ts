import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '.github/workflows/pumuki-phase5-mock.yml'
);

const loadWorkflow = (): string => readFileSync(workflowPath, 'utf8');

test('phase5 mock workflow runs package smoke block/minimal before closure', () => {
  const workflow = loadWorkflow();

  const smokeBlockStep = workflow.indexOf('Run package smoke block');
  const smokeMinimalStep = workflow.indexOf('Run package smoke minimal');
  const closureStep = workflow.indexOf('Run phase5 mock closure one-shot');

  assert.ok(smokeBlockStep >= 0, 'package smoke block step must exist');
  assert.ok(smokeMinimalStep >= 0, 'package smoke minimal step must exist');
  assert.ok(closureStep >= 0, 'phase5 closure step must exist');
  assert.ok(smokeBlockStep < closureStep, 'block smoke must run before closure');
  assert.ok(smokeMinimalStep < closureStep, 'minimal smoke must run before closure');
});

test('phase5 mock workflow executes one-shot mock closure command', () => {
  const workflow = loadWorkflow();
  assert.match(
    workflow,
    /run:\s*npm run validation:phase5-execution-closure -- --repo mock\/consumer --out-dir \.audit-reports\/phase5 --mock-consumer/
  );
});

test('phase5 mock workflow uploads phase5 and package smoke artifacts', () => {
  const workflow = loadWorkflow();
  assert.match(workflow, /name:\s*phase5-mock-closure/);
  assert.match(workflow, /\.audit-reports\/phase5/);
  assert.match(workflow, /\.audit-reports\/package-smoke\/block/);
  assert.match(workflow, /\.audit-reports\/package-smoke\/minimal/);
});
