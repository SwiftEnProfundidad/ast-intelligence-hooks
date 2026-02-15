import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNameStatus, hasAllowedExtension, buildFactsFromChanges } from '../gitDiffUtils';

test('parseNameStatus returns empty array for empty string', () => {
  assert.deepEqual(parseNameStatus(''), []);
});

test('parseNameStatus returns empty array for whitespace-only string', () => {
  assert.deepEqual(parseNameStatus('   \n  \n  '), []);
});

test('parseNameStatus parses added file', () => {
  const result = parseNameStatus('A\tsrc/index.ts');
  assert.deepEqual(result, [{ path: 'src/index.ts', changeType: 'added' }]);
});

test('parseNameStatus parses modified file', () => {
  const result = parseNameStatus('M\tsrc/utils.ts');
  assert.deepEqual(result, [{ path: 'src/utils.ts', changeType: 'modified' }]);
});

test('parseNameStatus parses deleted file', () => {
  const result = parseNameStatus('D\tsrc/old.ts');
  assert.deepEqual(result, [{ path: 'src/old.ts', changeType: 'deleted' }]);
});

test('parseNameStatus parses renamed file (R status) using destination path', () => {
  const result = parseNameStatus('R100\tsrc/old.ts\tsrc/new.ts');
  assert.deepEqual(result, [{ path: 'src/new.ts', changeType: 'modified' }]);
});

test('parseNameStatus parses copied file (C status) using destination path', () => {
  const result = parseNameStatus('C100\tsrc/original.ts\tsrc/copy.ts');
  assert.deepEqual(result, [{ path: 'src/copy.ts', changeType: 'modified' }]);
});

test('parseNameStatus skips unknown status codes', () => {
  const result = parseNameStatus('X\tsrc/unknown.ts');
  assert.deepEqual(result, []);
});

test('parseNameStatus skips lines without path', () => {
  const result = parseNameStatus('A');
  assert.deepEqual(result, []);
});

test('parseNameStatus parses multiple lines', () => {
  const input = [
    'A\tsrc/new.ts',
    'M\tsrc/changed.ts',
    'D\tsrc/removed.ts',
    'R090\tsrc/before.ts\tsrc/after.ts',
  ].join('\n');
  const result = parseNameStatus(input);
  assert.deepEqual(result, [
    { path: 'src/new.ts', changeType: 'added' },
    { path: 'src/changed.ts', changeType: 'modified' },
    { path: 'src/removed.ts', changeType: 'deleted' },
    { path: 'src/after.ts', changeType: 'modified' },
  ]);
});

test('parseNameStatus skips empty lines in multi-line input', () => {
  const input = 'A\tsrc/a.ts\n\nM\tsrc/b.ts\n';
  const result = parseNameStatus(input);
  assert.deepEqual(result, [
    { path: 'src/a.ts', changeType: 'added' },
    { path: 'src/b.ts', changeType: 'modified' },
  ]);
});

test('parseNameStatus handles path with spaces', () => {
  const result = parseNameStatus('A\tsrc/my file.ts');
  assert.deepEqual(result, [{ path: 'src/my file.ts', changeType: 'added' }]);
});

test('hasAllowedExtension returns true for matching extension', () => {
  assert.equal(hasAllowedExtension('src/index.ts', ['.ts', '.tsx']), true);
});

test('hasAllowedExtension returns false for non-matching extension', () => {
  assert.equal(hasAllowedExtension('src/index.js', ['.ts', '.tsx']), false);
});

test('hasAllowedExtension returns false for empty extensions list', () => {
  assert.equal(hasAllowedExtension('src/index.ts', []), false);
});

test('hasAllowedExtension matches .swift extension', () => {
  assert.equal(hasAllowedExtension('apps/ios/App.swift', ['.swift', '.ts']), true);
});

test('hasAllowedExtension does not partial-match', () => {
  assert.equal(hasAllowedExtension('src/index.tsx', ['.ts']), false);
});

test('buildFactsFromChanges creates change and content facts for non-deleted files', () => {
  const changes = [
    { path: 'src/a.ts', changeType: 'added' as const },
    { path: 'src/b.ts', changeType: 'modified' as const },
  ];
  const facts = buildFactsFromChanges(changes, 'test:source', () => 'file content');
  assert.equal(facts.length, 4);
  assert.equal(facts[0].kind, 'FileChange');
  assert.equal(facts[1].kind, 'FileContent');
  assert.equal(facts[2].kind, 'FileChange');
  assert.equal(facts[3].kind, 'FileContent');
});

test('buildFactsFromChanges skips content fact for deleted files', () => {
  const changes = [{ path: 'src/removed.ts', changeType: 'deleted' as const }];
  const facts = buildFactsFromChanges(changes, 'test:source', () => {
    throw new Error('should not be called for deleted files');
  });
  assert.equal(facts.length, 1);
  assert.equal(facts[0].kind, 'FileChange');
});

test('buildFactsFromChanges returns empty array for empty changes', () => {
  const facts = buildFactsFromChanges([], 'test:source', () => '');
  assert.deepEqual(facts, []);
});
