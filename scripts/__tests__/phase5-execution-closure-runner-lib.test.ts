import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhase5ExecutionClosureDryRunPlan,
  parsePhase5ExecutionClosureArgs,
} from '../phase5-execution-closure-runner-lib';

test('parsePhase5ExecutionClosureArgs applies defaults with required repo', () => {
  const options = parsePhase5ExecutionClosureArgs(['--repo', 'owner/repo']);

  assert.equal(options.repo, 'owner/repo');
  assert.equal(options.limit, 20);
  assert.equal(options.outDir, '.audit-reports/phase5');
  assert.equal(options.includeAdapter, true);
});

test('parsePhase5ExecutionClosureArgs configures mock consumer mode defaults', () => {
  const options = parsePhase5ExecutionClosureArgs([
    '--repo',
    'owner/repo',
    '--mock-consumer',
  ]);

  assert.equal(options.useMockConsumerTriage, true);
  assert.equal(options.includeAuthPreflight, false);
  assert.equal(options.runWorkflowLint, false);
  assert.equal(options.includeAdapter, false);
});

test('buildPhase5ExecutionClosureDryRunPlan renders deterministic command lines', () => {
  const plan = buildPhase5ExecutionClosureDryRunPlan([
    {
      id: 'phase5-blockers-readiness',
      description: 'Generate blockers report',
      script: 'scripts/build-phase5-blockers-readiness.ts',
      args: ['--out', '.audit-reports/phase5/blockers.md'],
      required: true,
      outputFiles: ['.audit-reports/phase5/blockers.md'],
    },
  ]);

  assert.match(plan, /phase5 execution closure dry-run plan:/);
  assert.match(plan, /scripts\/build-phase5-blockers-readiness\.ts --out/);
});
