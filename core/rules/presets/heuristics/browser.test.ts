import assert from 'node:assert/strict';
import test from 'node:test';
import { browserRules } from './browser';

test('browserRules define reglas heurísticas locked para plataforma generic', () => {
  assert.equal(browserRules.length, 3);

  const ids = browserRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.document-write.ast',
    'heuristics.ts.insert-adjacent-html.ast',
  ]);

  const byId = new Map(browserRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.inner-html.ast')?.then.code,
    'HEURISTICS_INNER_HTML_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.document-write.ast')?.then.code,
    'HEURISTICS_DOCUMENT_WRITE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.insert-adjacent-html.ast')?.then.code,
    'HEURISTICS_INSERT_ADJACENT_HTML_AST'
  );

  for (const rule of browserRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
