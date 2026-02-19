import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { evaluateSddPolicy } from '../policy';
import { openSddSession } from '../sessionStore';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const withFixtureRepo = async (
  prefix: string,
  callback: (repoRoot: string) => Promise<void> | void
): Promise<void> => {
  const repoRoot = mkdtempSync(join(tmpdir(), prefix));
  runGit(repoRoot, ['init', '-b', 'main']);
  runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repoRoot, 'README.md'), '# fixture\n', 'utf8');
  try {
    await callback(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

const writeOpenSpecBinary = (
  repoRoot: string,
  params?: {
    version?: string;
    validateExitCode?: number;
    totals?: { items: number; failed: number; passed: number };
    issues?: { errors: number; warnings: number; infos: number };
  }
): void => {
  const version = params?.version ?? 'OpenSpec CLI v1.1.1';
  const validateExitCode = params?.validateExitCode ?? 0;
  const totals = params?.totals ?? { items: 1, failed: 0, passed: 1 };
  const issues = params?.issues ?? { errors: 0, warnings: 0, infos: 0 };
  const validationPayload = JSON.stringify({
    summary: {
      totals,
      byLevel: {
        ERROR: issues.errors,
        WARNING: issues.warnings,
        INFO: issues.infos,
      },
    },
  });

  const binDir = join(repoRoot, 'node_modules', '.bin');
  mkdirSync(binDir, { recursive: true });
  const jsPath = join(binDir, 'openspec');
  const script = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('--version')) {
  process.stdout.write(${JSON.stringify(version)} + '\\n');
  process.exit(0);
}
if (args[0] === 'validate') {
  process.stdout.write(${JSON.stringify(validationPayload)});
  process.exit(${validateExitCode});
}
process.exit(0);
`;
  writeFileSync(jsPath, script, 'utf8');
  chmodSync(jsPath, 0o755);

  if (process.platform === 'win32') {
    const cmdPath = join(binDir, 'openspec.cmd');
    writeFileSync(cmdPath, '@echo off\r\nnode "%~dp0\\openspec" %*\r\n', 'utf8');
  }
};

const createOpenSpecChange = (repoRoot: string, changeId = 'add-auth-feature'): string => {
  const changePath = join(repoRoot, 'openspec', 'changes', changeId);
  mkdirSync(changePath, { recursive: true });
  writeFileSync(join(changePath, 'proposal.md'), '# proposal\n', 'utf8');
  return changeId;
};

test('evaluateSddPolicy allows emergency bypass via PUMUKI_SDD_BYPASS=1', () => {
  return withFixtureRepo('pumuki-sdd-bypass-', (repoRoot) => {
    const previous = process.env.PUMUKI_SDD_BYPASS;
    process.env.PUMUKI_SDD_BYPASS = '1';
    try {
      const result = evaluateSddPolicy({
        stage: 'PRE_COMMIT',
        repoRoot,
      });
      assert.equal(result.decision.allowed, true);
      assert.equal(result.decision.code, 'ALLOWED');
      assert.match(result.decision.message, /bypass/i);
    } finally {
      if (typeof previous === 'undefined') {
        delete process.env.PUMUKI_SDD_BYPASS;
      } else {
        process.env.PUMUKI_SDD_BYPASS = previous;
      }
    }
  });
});

test('evaluateSddPolicy bloquea con OPENSPEC_MISSING cuando no hay binario disponible', () => {
  return withFixtureRepo('pumuki-sdd-openspec-missing-', (repoRoot) => {
    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'OPENSPEC_MISSING');
  });
});

test('evaluateSddPolicy bloquea con OPENSPEC_VERSION_UNSUPPORTED cuando la versión es menor al mínimo', () => {
  return withFixtureRepo('pumuki-sdd-version-unsupported-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot, { version: 'OpenSpec CLI v1.0.0' });
    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'OPENSPEC_VERSION_UNSUPPORTED');
  });
});

test('evaluateSddPolicy bloquea con OPENSPEC_PROJECT_MISSING cuando falta openspec/', () => {
  return withFixtureRepo('pumuki-sdd-project-missing-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot, { version: 'OpenSpec CLI v1.1.1' });
    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'OPENSPEC_PROJECT_MISSING');
  });
});

test('evaluateSddPolicy bloquea con SDD_SESSION_MISSING cuando no existe sesión activa', () => {
  return withFixtureRepo('pumuki-sdd-session-missing-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot, { version: 'OpenSpec CLI v1.1.1' });
    createOpenSpecChange(repoRoot);

    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'SDD_SESSION_MISSING');
  });
});

test('evaluateSddPolicy bloquea con SDD_SESSION_INVALID cuando la sesión está expirada', () => {
  return withFixtureRepo('pumuki-sdd-session-invalid-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot);
    const changeId = createOpenSpecChange(repoRoot);
    openSddSession({ cwd: repoRoot, changeId, ttlMinutes: 30 });
    runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.expiresAt', '2000-01-01T00:00:00.000Z']);

    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'SDD_SESSION_INVALID');
  });
});

test('evaluateSddPolicy bloquea con SDD_CHANGE_ARCHIVED cuando el cambio activo está archivado', () => {
  return withFixtureRepo('pumuki-sdd-change-archived-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot);
    const changeId = createOpenSpecChange(repoRoot);
    openSddSession({ cwd: repoRoot, changeId, ttlMinutes: 30 });
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'archive', changeId), {
      recursive: true,
    });

    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'SDD_CHANGE_ARCHIVED');
  });
});

test('evaluateSddPolicy bloquea con SDD_CHANGE_MISSING cuando el cambio activo ya no existe', () => {
  return withFixtureRepo('pumuki-sdd-change-missing-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot);
    const changeId = createOpenSpecChange(repoRoot);
    openSddSession({ cwd: repoRoot, changeId, ttlMinutes: 30 });
    rmSync(join(repoRoot, 'openspec', 'changes', changeId), {
      recursive: true,
      force: true,
    });

    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'SDD_CHANGE_MISSING');
  });
});

test('evaluateSddPolicy permite PRE_WRITE con sesión válida sin ejecutar validación de cambios', () => {
  return withFixtureRepo('pumuki-sdd-prewrite-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot, {
      validateExitCode: 2,
      totals: { items: 2, failed: 1, passed: 1 },
      issues: { errors: 1, warnings: 0, infos: 0 },
    });
    const changeId = createOpenSpecChange(repoRoot);
    openSddSession({ cwd: repoRoot, changeId, ttlMinutes: 30 });

    const result = evaluateSddPolicy({ stage: 'PRE_WRITE', repoRoot });
    assert.equal(result.decision.allowed, true);
    assert.equal(result.decision.code, 'ALLOWED');
    assert.equal(result.validation, undefined);
  });
});

test('evaluateSddPolicy bloquea con SDD_VALIDATION_FAILED cuando OpenSpec devuelve exit code distinto de cero', () => {
  return withFixtureRepo('pumuki-sdd-validation-failed-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot, {
      validateExitCode: 2,
      totals: { items: 3, failed: 1, passed: 2 },
      issues: { errors: 1, warnings: 0, infos: 0 },
    });
    const changeId = createOpenSpecChange(repoRoot);
    openSddSession({ cwd: repoRoot, changeId, ttlMinutes: 30 });

    const result = evaluateSddPolicy({ stage: 'PRE_COMMIT', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'SDD_VALIDATION_FAILED');
    assert.equal(result.decision.details?.exitCode, 2);
    assert.equal(result.decision.details?.failedItems, 1);
    assert.equal(result.decision.details?.errors, 1);
  });
});

test('evaluateSddPolicy bloquea con SDD_VALIDATION_ERROR cuando exit code es cero pero hay fallos en el resumen', () => {
  return withFixtureRepo('pumuki-sdd-validation-error-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot, {
      validateExitCode: 0,
      totals: { items: 2, failed: 1, passed: 1 },
      issues: { errors: 0, warnings: 1, infos: 0 },
    });
    const changeId = createOpenSpecChange(repoRoot);
    openSddSession({ cwd: repoRoot, changeId, ttlMinutes: 30 });

    const result = evaluateSddPolicy({ stage: 'PRE_PUSH', repoRoot });
    assert.equal(result.decision.allowed, false);
    assert.equal(result.decision.code, 'SDD_VALIDATION_ERROR');
    assert.equal(result.decision.details?.exitCode, 0);
  });
});

test('evaluateSddPolicy permite CI cuando validación OpenSpec es satisfactoria', () => {
  return withFixtureRepo('pumuki-sdd-validation-ok-', (repoRoot) => {
    writeOpenSpecBinary(repoRoot, {
      validateExitCode: 0,
      totals: { items: 4, failed: 0, passed: 4 },
      issues: { errors: 0, warnings: 2, infos: 1 },
    });
    const changeId = createOpenSpecChange(repoRoot);
    openSddSession({ cwd: repoRoot, changeId, ttlMinutes: 30 });

    const result = evaluateSddPolicy({ stage: 'CI', repoRoot });
    assert.equal(result.decision.allowed, true);
    assert.equal(result.decision.code, 'ALLOWED');
    assert.equal(result.decision.details?.passedItems, 4);
    assert.equal(result.decision.details?.warnings, 2);
    assert.equal(result.validation?.ok, true);
  });
});
