import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const MAX_TS_LINES = 1500;
const MAX_TS_IMPORTS = 22;
const ROOT_DIR = process.cwd();
const SCAN_DIRS = ['core', 'integrations'];

const collectTsSourceFiles = (rootDir: string): string[] => {
  const entries = readdirSync(rootDir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(rootDir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectTsSourceFiles(fullPath));
      continue;
    }

    if (!entry.endsWith('.ts')) {
      continue;
    }
    if (entry.endsWith('.test.ts') || entry.endsWith('.spec.ts') || entry.endsWith('.d.ts')) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
};

const countImports = (source: string): number => {
  return source.split('\n').filter((line) => line.trimStart().startsWith('import ')).length;
};

test('core/integrations respetan guardrail de tamaño e imports', () => {
  const files = SCAN_DIRS.flatMap((scanDir) => collectTsSourceFiles(join(ROOT_DIR, scanDir)));
  const linesOffenders: string[] = [];
  const importsOffenders: string[] = [];

  for (const filePath of files) {
    const source = readFileSync(filePath, 'utf8');
    const lineCount = source.split('\n').length;
    const importCount = countImports(source);
    const relativePath = relative(ROOT_DIR, filePath);

    if (lineCount > MAX_TS_LINES) {
      linesOffenders.push(`${relativePath}: ${lineCount} líneas`);
    }
    if (importCount > MAX_TS_IMPORTS) {
      importsOffenders.push(`${relativePath}: ${importCount} imports`);
    }
  }

  assert.equal(
    linesOffenders.length,
    0,
    `Se excedió el guardrail de líneas (${MAX_TS_LINES}):\n${linesOffenders.join('\n')}`,
  );
  assert.equal(
    importsOffenders.length,
    0,
    `Se excedió el guardrail de imports (${MAX_TS_IMPORTS}):\n${importsOffenders.join('\n')}`,
  );
});
