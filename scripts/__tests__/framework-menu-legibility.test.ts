import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeMenuDensity,
  truncateTextForTerminal,
  wrapLineForTerminal,
} from '../framework-menu-legibility-lib';

test('truncateTextForTerminal aplica elipsis al superar limite', () => {
  assert.equal(truncateTextForTerminal('abcdef', 5), 'abcd…');
  assert.equal(truncateTextForTerminal('abc', 5), 'abc');
  assert.equal(truncateTextForTerminal('abc', 1), '…');
});

test('normalizeMenuDensity elimina exceso de lineas en blanco', () => {
  const normalized = normalizeMenuDensity(
    ['A', '', '', '', 'B', '', '', 'C', '', ''],
    { maxConsecutiveBlankLines: 1 }
  );
  assert.deepEqual(normalized, ['A', '', 'B', '', 'C']);
});

test('normalizeMenuDensity en modo compacto elimina huecos', () => {
  const normalized = normalizeMenuDensity(
    ['A', '', 'B', '', '', 'C'],
    { compactMode: true }
  );
  assert.deepEqual(normalized, ['A', 'B', 'C']);
});

test('wrapLineForTerminal divide texto largo respetando palabras', () => {
  const wrapped = wrapLineForTerminal(
    'Source files -> AST analyzers -> violations -> severity evaluation -> AI Gate verdict',
    24
  );
  assert.ok(wrapped.length > 1);
  for (const line of wrapped) {
    assert.ok(line.length <= 24, `line exceeds width: ${line}`);
  }
});
