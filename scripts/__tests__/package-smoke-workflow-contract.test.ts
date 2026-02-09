import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '.github/workflows/pumuki-package-smoke.yml'
);

const loadWorkflow = (): string => readFileSync(workflowPath, 'utf8');

test('package smoke workflow keeps block/minimal matrix coverage', () => {
  const workflow = loadWorkflow();
  assert.match(workflow, /mode:\s*\[block,\s*minimal\]/);
});

test('package smoke workflow runs mode-aware smoke command', () => {
  const workflow = loadWorkflow();
  assert.match(
    workflow,
    /run:\s*node --import tsx scripts\/package-install-smoke\.ts --mode=\$\{\{\s*matrix\.mode\s*\}\}/
  );
});

test('package smoke workflow uploads mode-scoped artifacts', () => {
  const workflow = loadWorkflow();
  assert.match(workflow, /name:\s*package-smoke-report-\$\{\{\s*matrix\.mode\s*\}\}/);
  assert.match(
    workflow,
    /path:\s*\.audit-reports\/package-smoke\/\$\{\{\s*matrix\.mode\s*\}\}/
  );
});

test('package manifest guard step runs before smoke execution', () => {
  const workflow = loadWorkflow();
  const manifestStep = workflow.indexOf('Validate package manifest (dry-run)');
  const smokeStep = workflow.indexOf('Run package install smoke');

  assert.ok(manifestStep >= 0, 'manifest guard step must exist');
  assert.ok(smokeStep >= 0, 'smoke step must exist');
  assert.ok(manifestStep < smokeStep, 'manifest guard must run before smoke');
});
