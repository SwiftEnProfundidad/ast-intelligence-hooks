import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPumukiManagedHookBlock,
  hasPumukiManagedBlock,
  removePumukiManagedBlock,
  upsertPumukiManagedBlock,
} from '../hookBlock';

test('buildPumukiManagedHookBlock genera comando correcto por hook', () => {
  const preCommit = buildPumukiManagedHookBlock('pre-commit');
  const prePush = buildPumukiManagedHookBlock('pre-push');

  assert.match(preCommit, /npx --yes pumuki-pre-commit/);
  assert.match(prePush, /npx --yes pumuki-pre-push/);
  assert.match(preCommit, /PUMUKI MANAGED START/);
  assert.match(preCommit, /PUMUKI MANAGED END/);
});

test('upsertPumukiManagedBlock inserta shebang cuando el contenido inicial está vacío', () => {
  const updated = upsertPumukiManagedBlock({
    contents: '',
    hook: 'pre-commit',
  });

  assert.match(updated, /^#!\/usr\/bin\/env sh\n\n# >>> PUMUKI MANAGED START >>>/);
  assert.equal(hasPumukiManagedBlock(updated), true);
});

test('upsertPumukiManagedBlock reemplaza bloque existente sin duplicarlo', () => {
  const baseline = upsertPumukiManagedBlock({
    contents: '#!/usr/bin/env sh\n\necho "before"\n',
    hook: 'pre-commit',
  });

  const replaced = upsertPumukiManagedBlock({
    contents: baseline,
    hook: 'pre-push',
  });

  const startMatches = replaced.match(/# >>> PUMUKI MANAGED START >>>/g) ?? [];
  assert.equal(startMatches.length, 1);
  assert.match(replaced, /npx --yes pumuki-pre-push/);
  assert.doesNotMatch(replaced, /npx --yes pumuki-pre-commit/);
});

test('removePumukiManagedBlock limpia fichero si solo queda shebang y bloque', () => {
  const withBlock = upsertPumukiManagedBlock({
    contents: '#!/usr/bin/env sh\n',
    hook: 'pre-commit',
  });

  const removed = removePumukiManagedBlock(withBlock);
  assert.equal(removed.removed, true);
  assert.equal(removed.updated, '');
});

test('removePumukiManagedBlock preserva contenido ajeno y señala removed=false cuando no hay bloque', () => {
  const script = '#!/usr/bin/env sh\n\necho "custom"\n';
  const noChange = removePumukiManagedBlock(script);
  assert.equal(noChange.removed, false);
  assert.equal(noChange.updated, script);

  const withBlock = upsertPumukiManagedBlock({
    contents: script,
    hook: 'pre-commit',
  });
  const removed = removePumukiManagedBlock(withBlock);
  assert.equal(removed.removed, true);
  assert.equal(removed.updated, script);
});

test('hasPumukiManagedBlock devuelve false cuando solo existe un marcador', () => {
  const onlyStart = '#!/usr/bin/env sh\n# >>> PUMUKI MANAGED START >>>\n';
  const onlyEnd = '#!/usr/bin/env sh\n# <<< PUMUKI MANAGED END <<<\n';

  assert.equal(hasPumukiManagedBlock(onlyStart), false);
  assert.equal(hasPumukiManagedBlock(onlyEnd), false);
});

test('upsertPumukiManagedBlock elimina whitespace colgante y garantiza salto final único', () => {
  const updated = upsertPumukiManagedBlock({
    contents: '#!/usr/bin/env sh\n\necho "custom"   \n\t\n',
    hook: 'pre-push',
  });

  assert.match(updated, /\n# >>> PUMUKI MANAGED START >>>/);
  assert.equal(updated.endsWith('\n'), true);
  assert.equal(updated.endsWith('\n\n'), false);
  assert.doesNotMatch(updated, /[ \t]+\n/);
});

test('removePumukiManagedBlock mantiene contenido before/after sin líneas sobrantes', () => {
  const scriptWithBlock = [
    '#!/usr/bin/env sh',
    '',
    'echo "before"',
    '',
    buildPumukiManagedHookBlock('pre-commit'),
    '',
    'echo "after"',
    '',
  ].join('\n');

  const removed = removePumukiManagedBlock(scriptWithBlock);
  assert.equal(removed.removed, true);
  assert.equal(
    removed.updated,
    '#!/usr/bin/env sh\n\necho "before"\n\necho "after"\n'
  );
});
