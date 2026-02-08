import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

const walkTsFiles = (rootDir: string): string[] => {
  const absoluteRoot = join(repoRoot, rootDir);
  const stack = [absoluteRoot];
  const files: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current)) {
      const absolute = join(current, entry);
      const stats = statSync(absolute);

      if (stats.isDirectory()) {
        if (entry === '__tests__') {
          continue;
        }
        stack.push(absolute);
        continue;
      }

      if (!absolute.endsWith('.ts')) {
        continue;
      }

      files.push(absolute);
    }
  }

  return files;
};

test('core and integrations remain IDE-agnostic (no Adapter runtime command coupling)', () => {
  const bannedSignals = [
    'build-adapter-real-session-report',
    'build-adapter-session-status',
    'install:adapter-hooks-config',
    'verify:adapter-hooks-runtime',
    'assess:adapter-hooks-session',
    '~/.codeium/adapter',
    '.codeium/adapter',
    '~/.codex/',
    '/.codex/',
  ];

  const roots = ['core', 'integrations'];
  const matches: string[] = [];

  for (const root of roots) {
    for (const absolutePath of walkTsFiles(root)) {
      const content = readFileSync(absolutePath, 'utf8');
      const relativePath = relative(repoRoot, absolutePath);

      for (const signal of bannedSignals) {
        if (content.includes(signal)) {
          matches.push(`${relativePath} -> ${signal}`);
        }
      }
    }
  }

  assert.deepEqual(
    matches,
    [],
    [
      'IDE-specific runtime coupling detected in core/integrations.',
      'Move IDE diagnostics to scripts/docs adapters only.',
      ...matches.map((match) => `- ${match}`),
    ].join('\n')
  );
});
