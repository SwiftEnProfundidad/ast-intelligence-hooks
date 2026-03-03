import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  evaluateOpenSpecCompatibility,
  OPENSPEC_COMPATIBILITY_MATRIX,
  validateOpenSpecChanges,
} from '../openSpecCli';

test('evaluateOpenSpecCompatibility marca incompatible cuando OpenSpec no está instalado', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: false,
    version: undefined,
  });

  assert.equal(result.compatible, false);
  assert.equal(result.minimumVersion, OPENSPEC_COMPATIBILITY_MATRIX.minimumVersion);
  assert.equal(result.recommendedVersion, OPENSPEC_COMPATIBILITY_MATRIX.recommendedVersion);
});

test('evaluateOpenSpecCompatibility marca incompatible cuando la versión detectada es menor al mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI v1.0.9',
  });

  assert.equal(result.compatible, false);
  assert.equal(result.parsedVersion, '1.0.9');
});

test('evaluateOpenSpecCompatibility marca compatible cuando la versión detectada cumple el mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: '1.1.1',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.1.1');
});

test('evaluateOpenSpecCompatibility marca incompatible cuando no puede parsear semver', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI unknown',
  });

  assert.equal(result.compatible, false);
  assert.equal(result.parsedVersion, undefined);
});

test('evaluateOpenSpecCompatibility marca compatible cuando la versión detectada supera el mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI v1.2.0',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.2.0');
  assert.equal(result.detectedVersion, 'OpenSpec CLI v1.2.0');
});

test('evaluateOpenSpecCompatibility marca compatible en patch superior del mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: '1.1.9',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.1.9');
});

test('evaluateOpenSpecCompatibility acepta formato con prefijo "v" en la versión mínima', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'v1.1.1',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.1.1');
});

test('evaluateOpenSpecCompatibility marca incompatible en versión menor de minor', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI 1.0.99',
  });

  assert.equal(result.compatible, false);
  assert.equal(result.parsedVersion, '1.0.99');
});

test('validateOpenSpecChanges ejecuta openspec validate --all para alinear contrato de completitud', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-sdd-openspec-validate-all-'));
  try {
    const binDir = join(repoRoot, 'node_modules', '.bin');
    const argsCapturePath = join(repoRoot, 'openspec-args.json');
    mkdirSync(binDir, { recursive: true });

    const jsPath = join(binDir, 'openspec');
    const script = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(argsCapturePath)}, JSON.stringify(args), 'utf8');
if (args[0] === 'validate') {
  process.stdout.write(JSON.stringify({
    summary: {
      totals: { items: 1, failed: 0, passed: 1 },
      byLevel: { ERROR: 0, WARNING: 0, INFO: 0 }
    }
  }));
  process.exit(0);
}
process.exit(0);
`;
    writeFileSync(jsPath, script, 'utf8');
    chmodSync(jsPath, 0o755);
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'dummy-change'), { recursive: true });

    const validation = validateOpenSpecChanges(repoRoot);
    assert.equal(validation.ok, true);
    const args = JSON.parse(readFileSync(argsCapturePath, 'utf8')) as Array<string>;
    assert.deepEqual(args, ['validate', '--all', '--json', '--no-interactive']);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
