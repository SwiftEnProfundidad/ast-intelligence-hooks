import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const MAX_TS_LINES = 1500;
const MAX_TS_IMPORTS = 22;
const ROOT_DIR = process.cwd();
const SCAN_DIRS = ['core', 'integrations'];
const FILE_LINE_LIMIT_OVERRIDES: Readonly<Record<string, number>> = {
  'core/facts/detectors/typescript/index.ts': 2100,
  'integrations/lifecycle/cli.ts': 2800,
};
const FILE_IMPORT_LIMIT_OVERRIDES: Readonly<Record<string, number>> = {
  'integrations/git/runPlatformGate.ts': 28,
  'integrations/lifecycle/cli.ts': 35,
};

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

    const fileLineLimit = FILE_LINE_LIMIT_OVERRIDES[relativePath] ?? MAX_TS_LINES;
    if (lineCount > fileLineLimit) {
      linesOffenders.push(`${relativePath}: ${lineCount} líneas (máx ${fileLineLimit})`);
    }
    const fileImportLimit = FILE_IMPORT_LIMIT_OVERRIDES[relativePath] ?? MAX_TS_IMPORTS;
    if (importCount > fileImportLimit) {
      importsOffenders.push(`${relativePath}: ${importCount} imports (máx ${fileImportLimit})`);
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
