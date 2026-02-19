import assert from 'node:assert/strict';
import test from 'node:test';
import { iosRules } from './ios';

test('iosRules define reglas heurísticas locked para plataforma ios', () => {
  assert.equal(iosRules.length, 16);

  const ids = iosRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ios.force-unwrap.ast',
    'heuristics.ios.anyview.ast',
    'heuristics.ios.force-try.ast',
    'heuristics.ios.force-cast.ast',
    'heuristics.ios.callback-style.ast',
    'heuristics.ios.dispatchqueue.ast',
    'heuristics.ios.dispatchgroup.ast',
    'heuristics.ios.dispatchsemaphore.ast',
    'heuristics.ios.operation-queue.ast',
    'heuristics.ios.task-detached.ast',
    'heuristics.ios.unchecked-sendable.ast',
    'heuristics.ios.observable-object.ast',
    'heuristics.ios.navigation-view.ast',
    'heuristics.ios.on-tap-gesture.ast',
    'heuristics.ios.string-format.ast',
    'heuristics.ios.uiscreen-main-bounds.ast',
  ]);

  const byId = new Map(iosRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ios.force-unwrap.ast')?.then.code,
    'HEURISTICS_IOS_FORCE_UNWRAP_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.task-detached.ast')?.then.code,
    'HEURISTICS_IOS_TASK_DETACHED_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.uiscreen-main-bounds.ast')?.then.code,
    'HEURISTICS_IOS_UISCREEN_MAIN_BOUNDS_AST'
  );

  for (const rule of iosRules) {
    assert.equal(rule.platform, 'ios');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
