import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readPreWriteLeaseStatus,
  resolvePreWriteLeasePath,
  toPreWriteEnforcementGapFinding,
  writePreWriteLease,
} from '../preWriteLease';

const createGitStub = (params: {
  head?: string;
  branch?: string;
  dirtyPaths?: string[];
}) => ({
  runGit: (args: ReadonlyArray<string>): string => {
    const joined = args.join(' ');
    if (joined === 'rev-parse HEAD') {
      return `${params.head ?? 'abc123'}\n`;
    }
    if (joined === 'rev-parse --abbrev-ref HEAD') {
      return `${params.branch ?? 'feature/prewrite-lease'}\n`;
    }
    if (
      joined === 'diff --name-only' ||
      joined === 'diff --cached --name-only' ||
      joined === 'ls-files --others --exclude-standard'
    ) {
      return `${(params.dirtyPaths ?? []).join('\n')}\n`;
    }
    return '';
  },
});

test('writePreWriteLease emite lease valido solo cuando no hay cambios de codigo', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-prewrite-lease-clean-'));
  try {
    const result = writePreWriteLease({
      repoRoot,
      git: createGitStub({ dirtyPaths: [] }),
      now: new Date('2026-05-14T10:00:00.000Z'),
    });
    assert.equal(result.valid, true);
    assert.equal(result.written, true);

    const status = readPreWriteLeaseStatus({
      repoRoot,
      git: createGitStub({ dirtyPaths: ['apps/ios/App.swift'] }),
      now: new Date('2026-05-14T10:10:00.000Z'),
    });
    assert.equal(status.valid, true);
    assert.deepEqual(status.changedCodePaths, ['apps/ios/App.swift']);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('writePreWriteLease no valida un PRE_WRITE ejecutado despues de cambios de codigo', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-prewrite-lease-dirty-'));
  try {
    const result = writePreWriteLease({
      repoRoot,
      git: createGitStub({ dirtyPaths: ['apps/ios/App.swift'] }),
      now: new Date('2026-05-14T10:00:00.000Z'),
    });
    assert.equal(result.valid, false);
    assert.equal(result.written, false);
    assert.equal(result.code, 'PRE_WRITE_LEASE_NOT_WRITTEN_DIRTY_CODE');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('writePreWriteLease emite lease de diff validado cuando PRE_WRITE ya permitio el slice', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-prewrite-lease-validated-diff-'));
  try {
    const result = writePreWriteLease({
      repoRoot,
      git: createGitStub({ dirtyPaths: ['apps/web-app/src/pages/Login.tsx'] }),
      now: new Date('2026-05-18T10:00:00.000Z'),
      allowExistingCodeChanges: true,
    });
    assert.equal(result.valid, true);
    assert.equal(result.written, true);
    assert.equal(result.lease?.validation_mode, 'validated-diff');

    const status = readPreWriteLeaseStatus({
      repoRoot,
      git: createGitStub({ dirtyPaths: ['apps/web-app/src/pages/Login.tsx'] }),
      now: new Date('2026-05-18T10:10:00.000Z'),
    });
    assert.equal(status.valid, true);
    assert.deepEqual(status.changedCodePaths, ['apps/web-app/src/pages/Login.tsx']);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('readPreWriteLeaseStatus invalida lease de diff validado si cambia el slice', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-prewrite-lease-validated-diff-mismatch-'));
  try {
    const result = writePreWriteLease({
      repoRoot,
      git: createGitStub({ dirtyPaths: ['apps/web-app/src/pages/Login.tsx'] }),
      now: new Date('2026-05-18T10:00:00.000Z'),
      allowExistingCodeChanges: true,
    });
    assert.equal(result.valid, true);

    const status = readPreWriteLeaseStatus({
      repoRoot,
      git: createGitStub({ dirtyPaths: ['apps/web-app/src/pages/Register.tsx'] }),
      now: new Date('2026-05-18T10:10:00.000Z'),
    });
    assert.equal(status.valid, false);
    assert.equal(status.code, 'PRE_WRITE_LEASE_DIRTY_AT_ISSUE');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('readPreWriteLeaseStatus invalida lease emitido con HEAD distinto', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-prewrite-lease-head-'));
  try {
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      resolvePreWriteLeasePath(repoRoot),
      JSON.stringify(
        {
          version: '1',
          kind: 'pumuki-pre-write-lease',
          repo_root: repoRoot,
          head: 'old-head',
          branch: 'feature/prewrite-lease',
          issued_at: '2026-05-14T10:00:00.000Z',
          expires_at: '2026-05-14T14:00:00.000Z',
          pre_change_code_changes_count: 0,
          pre_change_code_paths: [],
        },
        null,
        2
      ),
      'utf8'
    );
    const status = readPreWriteLeaseStatus({
      repoRoot,
      git: createGitStub({ head: 'new-head', dirtyPaths: ['apps/ios/App.swift'] }),
      now: new Date('2026-05-14T10:10:00.000Z'),
    });
    assert.equal(status.valid, false);
    assert.equal(status.code, 'PRE_WRITE_LEASE_HEAD_MISMATCH');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('toPreWriteEnforcementGapFinding emite instrucciones separadas para usuario y agente IA', () => {
  const finding = toPreWriteEnforcementGapFinding({
    stage: 'PRE_COMMIT',
    status: {
      valid: false,
      code: 'PRE_WRITE_LEASE_MISSING',
      path: '.pumuki/prewrite-lease.json',
      changedCodePaths: ['apps/ios/App.swift'],
      message: 'No valid PRE_WRITE lease exists for this code diff.',
    },
  });

  assert.ok(finding);
  assert.equal(finding.code, 'ENFORCEMENT_GAP_PRE_WRITE_LEASE_MISSING');
  assert.match(finding.message, /User action: run `npx pumuki-pre-write`/);
  assert.match(finding.message, /AI agent instruction: STOP/);
  assert.match(finding.expected_fix ?? '', /do not apply patches or write files/);
});
