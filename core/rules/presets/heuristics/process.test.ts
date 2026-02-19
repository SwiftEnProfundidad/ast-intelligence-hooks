import assert from 'node:assert/strict';
import test from 'node:test';
import { processRules } from './process';

test('processRules define reglas heurísticas locked para plataforma generic', () => {
  assert.equal(processRules.length, 13);

  const ids = processRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.process-exit.ast',
    'heuristics.ts.child-process-import.ast',
    'heuristics.ts.process-env-mutation.ast',
    'heuristics.ts.dynamic-shell-invocation.ast',
    'heuristics.ts.child-process-shell-true.ast',
    'heuristics.ts.child-process-exec-file-untrusted-args.ast',
    'heuristics.ts.child-process-exec-sync.ast',
    'heuristics.ts.child-process-exec.ast',
    'heuristics.ts.child-process-spawn-sync.ast',
    'heuristics.ts.child-process-spawn.ast',
    'heuristics.ts.child-process-fork.ast',
    'heuristics.ts.child-process-exec-file-sync.ast',
    'heuristics.ts.child-process-exec-file.ast',
  ]);

  const byId = new Map(processRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.process-exit.ast')?.then.code,
    'HEURISTICS_PROCESS_EXIT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.dynamic-shell-invocation.ast')?.then.code,
    'HEURISTICS_DYNAMIC_SHELL_INVOCATION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.child-process-exec-file-untrusted-args.ast')?.then.code,
    'HEURISTICS_CHILD_PROCESS_EXEC_FILE_UNTRUSTED_ARGS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.child-process-exec-file.ast')?.then.code,
    'HEURISTICS_CHILD_PROCESS_EXEC_FILE_AST'
  );

  for (const rule of processRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
