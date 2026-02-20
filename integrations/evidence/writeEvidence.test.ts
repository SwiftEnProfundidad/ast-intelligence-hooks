import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../__tests__/helpers/tempDir';
import type { AiEvidenceV2_1 } from './schema';
import { writeEvidence } from './writeEvidence';

const withCwd = async <T>(cwd: string, callback: () => Promise<T> | T): Promise<T> => {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return await callback();
  } finally {
    process.chdir(previous);
  }
};

const initGitRepo = (cwd: string): void => {
  execFileSync('git', ['init', '-q'], {
    cwd,
    stdio: 'ignore',
  });
};

const sampleEvidence = (repoRoot: string): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-17T00:00:00.000Z',
  snapshot: {
    stage: 'PRE_PUSH',
    outcome: 'BLOCK',
    findings: [
      {
        ruleId: 'z.rule',
        severity: 'WARN',
        code: 'Z_RULE',
        message: 'z finding',
        file: join(repoRoot, 'apps/ios/B.swift'),
        lines: [9.8, 1, 1, Number.NaN, 4],
        matchedBy: 'FileContent',
        source: 'git:staged',
      },
      {
        ruleId: 'a.rule',
        severity: 'ERROR',
        code: 'A_RULE',
        message: 'a finding',
        file: 'apps/backend/A.ts',
        lines: '   ',
        matchedBy: 'Heuristic',
        source: 'heuristics:ast',
      },
    ],
  },
  ledger: [
    {
      ruleId: 'z.rule',
      file: join(repoRoot, 'apps/ios/B.swift'),
      lines: 8.9,
      firstSeen: '2026-02-16T00:00:00.000Z',
      lastSeen: '2026-02-17T00:00:00.000Z',
    },
    {
      ruleId: 'a.rule',
      file: 'apps/backend/A.ts',
      lines: [3, 2, 2],
      firstSeen: '2026-02-16T00:00:00.000Z',
      lastSeen: '2026-02-17T00:00:00.000Z',
    },
  ],
  platforms: {
    ios: { detected: true, confidence: 'HIGH' },
    backend: { detected: true, confidence: 'MEDIUM' },
  },
  rulesets: [
    { platform: 'ios', bundle: 'z-bundle', hash: 'hash-z' },
    { platform: 'backend', bundle: 'a-bundle', hash: 'hash-a' },
  ],
  human_intent: null,
  ai_gate: {
    status: 'BLOCKED',
    violations: [],
    human_intent: null,
  },
  severity_metrics: {
    gate_status: 'BLOCKED',
    total_violations: 2,
    by_severity: {
      CRITICAL: 0,
      ERROR: 1,
      WARN: 1,
      INFO: 0,
    },
  },
  repo_state: {
    repo_root: repoRoot,
    git: {
      available: true,
      branch: 'feature/write-evidence',
      upstream: 'origin/feature/write-evidence',
      ahead: 0,
      behind: 0,
      dirty: false,
      staged: 0,
      unstaged: 0,
    },
    lifecycle: {
      installed: true,
      package_version: '6.3.16',
      lifecycle_version: '6.3.16',
      hooks: {
        pre_commit: 'managed',
        pre_push: 'managed',
      },
    },
  },
  sdd_metrics: {
    enforced: true,
    stage: 'PRE_PUSH',
    decision: {
      allowed: true,
      code: 'ALLOWED',
      message: 'sdd policy passed',
    },
  },
});

test('writeEvidence escribe archivo estable y normaliza paths/orden/lineas', async () => {
  await withTempDir('pumuki-write-evidence-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      const result = writeEvidence(sampleEvidence(tempRoot));
      assert.equal(result.ok, true);
      assert.equal(result.path.endsWith('/.ai_evidence.json'), true);
      assert.equal(existsSync(result.path), true);

      const written = JSON.parse(readFileSync(result.path, 'utf8')) as AiEvidenceV2_1;

      assert.equal(written.snapshot.findings.length, 2);
      assert.equal(written.snapshot.findings[0]?.ruleId, 'a.rule');
      assert.equal(written.snapshot.findings[0]?.file, 'apps/backend/A.ts');
      assert.equal('lines' in (written.snapshot.findings[0] ?? {}), false);
      assert.equal(written.snapshot.findings[0]?.matchedBy, 'Heuristic');
      assert.equal(written.snapshot.findings[0]?.source, 'heuristics:ast');

      assert.equal(written.snapshot.findings[1]?.ruleId, 'z.rule');
      assert.equal(written.snapshot.findings[1]?.file.endsWith('/apps/ios/B.swift'), true);
      assert.deepEqual(written.snapshot.findings[1]?.lines, [1, 4, 9]);
      assert.equal(written.snapshot.findings[1]?.matchedBy, 'FileContent');
      assert.equal(written.snapshot.findings[1]?.source, 'git:staged');

      assert.equal(written.ledger[0]?.ruleId, 'a.rule');
      assert.deepEqual(written.ledger[0]?.lines, [2, 3]);
      assert.equal(written.ledger[1]?.ruleId, 'z.rule');
      assert.equal(written.ledger[1]?.lines, 8);

      assert.deepEqual(Object.keys(written.platforms), ['backend', 'ios']);
      assert.deepEqual(written.rulesets.map((item) => `${item.platform}:${item.bundle}`), [
        'backend:a-bundle',
        'ios:z-bundle',
      ]);
      assert.deepEqual(written.ai_gate.violations.map((item) => item.ruleId), ['a.rule', 'z.rule']);
      assert.deepEqual(
        written.ai_gate.violations.map((item) => [item.ruleId, item.matchedBy, item.source]),
        [
          ['a.rule', 'Heuristic', 'heuristics:ast'],
          ['z.rule', 'FileContent', 'git:staged'],
        ]
      );
      assert.deepEqual(written.sdd_metrics, {
        enforced: true,
        stage: 'PRE_PUSH',
        decision: {
          allowed: true,
          code: 'ALLOWED',
          message: 'sdd policy passed',
        },
      });
      assert.equal(written.repo_state?.git.branch, 'feature/write-evidence');
      assert.equal(written.repo_state?.lifecycle.hooks.pre_commit, 'managed');
    });
  });
});

test('writeEvidence devuelve ok=false cuando no puede escribir el archivo', async () => {
  await withTempDir('pumuki-write-evidence-error-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      mkdirSync('.ai_evidence.json');
      const originalWarn = console.warn;
      console.warn = () => {};
      try {
        const result = writeEvidence(sampleEvidence(tempRoot));
        assert.equal(result.ok, false);
        assert.equal(result.path.endsWith('/.ai_evidence.json'), true);
        assert.equal(typeof result.error, 'string');
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});

test('writeEvidence conserva paths externos y elimina lines no finitas', async () => {
  await withTempDir('pumuki-write-evidence-external-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      const externalFilePath = '/tmp/pumuki-external.ts';
      const evidence = sampleEvidence(tempRoot);
      evidence.snapshot.findings = [
        {
          ...evidence.snapshot.findings[0]!,
          file: externalFilePath,
          lines: Number.POSITIVE_INFINITY,
        },
      ];
      evidence.ledger = [
        {
          ...evidence.ledger[0]!,
          file: externalFilePath,
          lines: [Number.NaN, Number.POSITIVE_INFINITY],
        },
      ];
      evidence.severity_metrics.total_violations = 1;

      const result = writeEvidence(evidence);
      assert.equal(result.ok, true);

      const written = JSON.parse(readFileSync(result.path, 'utf8')) as AiEvidenceV2_1;
      assert.equal(written.snapshot.findings[0]?.file, externalFilePath);
      assert.equal('lines' in (written.snapshot.findings[0] ?? {}), false);
      assert.equal(written.ledger[0]?.file, externalFilePath);
      assert.equal('lines' in (written.ledger[0] ?? {}), false);
    });
  });
});
