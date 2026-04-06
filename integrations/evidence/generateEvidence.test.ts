import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../__tests__/helpers/tempDir';
import { generateEvidence } from './generateEvidence';
import type { AiEvidenceV2_1 } from './schema';

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

test('generateEvidence compone build + write y persiste .ai_evidence.json', async () => {
  await withTempDir('pumuki-generate-evidence-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      const result = generateEvidence({
        stage: 'PRE_PUSH',
        findings: [
          {
            ruleId: 'backend.no-console-log',
            severity: 'ERROR',
            code: 'BACKEND_NO_CONSOLE_LOG',
            message: 'console.log no permitido',
            filePath: 'apps/backend/src/main.ts',
          },
        ],
        detectedPlatforms: {
          backend: { detected: true, confidence: 'HIGH' },
        },
        loadedRulesets: [{ platform: 'backend', bundle: 'backendRuleSet', hash: 'hash-1' }],
      });

      assert.equal(result.evidence.version, '2.1');
      assert.equal(result.evidence.snapshot.stage, 'PRE_PUSH');
      assert.equal(result.evidence.snapshot.findings.length, 1);
      assert.equal(result.write.ok, true);
      assert.equal(result.write.path.endsWith('/.ai_evidence.json'), true);
      assert.equal(existsSync(result.write.path), true);

      const persisted = JSON.parse(readFileSync(join(tempRoot, '.ai_evidence.json'), 'utf8')) as AiEvidenceV2_1;
      assert.equal(persisted.version, '2.1');
      assert.equal(persisted.snapshot.stage, 'PRE_PUSH');
      assert.equal(persisted.snapshot.findings[0]?.ruleId, 'backend.no-console-log');
      assert.equal(persisted.ai_gate.status, 'ALLOWED');
    });
  });
});

test('generateEvidence omite escritura a disco cuando skipDiskWrite y repoRoot son válidos', async () => {
  await withTempDir('pumuki-generate-evidence-skip-', async (tempRoot) => {
    initGitRepo(tempRoot);
    const evidencePath = join(tempRoot, '.ai_evidence.json');
    writeFileSync(evidencePath, '{"version":"2.1","pinned":true}\n', 'utf8');

    const result = generateEvidence({
      stage: 'PRE_PUSH',
      gateOutcome: 'PASS',
      findings: [],
      detectedPlatforms: {},
      loadedRulesets: [],
      repoRoot: tempRoot,
      skipDiskWrite: true,
    });

    assert.equal(result.evidence.snapshot.stage, 'PRE_PUSH');
    assert.equal(result.write.ok, true);
    assert.equal(result.write.skipped, true);
    assert.equal(readFileSync(evidencePath, 'utf8'), '{"version":"2.1","pinned":true}\n');
  });
});

test('generateEvidence mantiene evidencia en memoria aunque write falle', async () => {
  await withTempDir('pumuki-generate-evidence-write-error-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      mkdirSync('.ai_evidence.json');

      const originalWarn = console.warn;
      console.warn = () => {};
      try {
        const result = generateEvidence({
          stage: 'CI',
          findings: [],
          detectedPlatforms: {},
          loadedRulesets: [],
        });

        assert.equal(result.evidence.version, '2.1');
        assert.equal(result.evidence.snapshot.stage, 'CI');
        assert.equal(result.write.ok, false);
        assert.equal(result.write.path.endsWith('/.ai_evidence.json'), true);
        assert.equal(typeof result.write.error, 'string');
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});

test('generateEvidence respeta gateOutcome explícito al componer build + write', async () => {
  await withTempDir('pumuki-generate-evidence-gate-outcome-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      const result = generateEvidence({
        stage: 'CI',
        gateOutcome: 'PASS',
        findings: [
          {
            ruleId: 'ios.force-unwrap',
            severity: 'CRITICAL',
            code: 'IOS_FORCE_UNWRAP',
            message: 'Force unwrap no permitido',
            filePath: 'apps/ios/App/Feature.swift',
          },
        ],
        detectedPlatforms: {
          ios: { detected: true, confidence: 'HIGH' },
        },
        loadedRulesets: [{ platform: 'ios', bundle: 'iosEnterpriseRuleSet', hash: 'hash-ios' }],
      });

      assert.equal(result.evidence.snapshot.outcome, 'PASS');
      assert.equal(result.evidence.ai_gate.status, 'ALLOWED');
      assert.equal(result.write.ok, true);

      const persisted = JSON.parse(readFileSync(join(tempRoot, '.ai_evidence.json'), 'utf8')) as AiEvidenceV2_1;
      assert.equal(persisted.snapshot.outcome, 'PASS');
      assert.equal(persisted.ai_gate.status, 'ALLOWED');
    });
  });
});

test('generateEvidence persiste metadata semantica enriquecida en findings bloqueantes', async () => {
  await withTempDir('pumuki-generate-evidence-ios-canary-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      const result = generateEvidence({
        stage: 'PRE_COMMIT',
        findings: [
          {
            ruleId: 'ios.canary-001.presentation-mixed-responsibilities',
            severity: 'CRITICAL',
            code: 'IOS_CANARY_001_PRESENTATION_MIXED_RESPONSIBILITIES',
            message: 'ViewModel mezcla responsabilidades.',
            filePath: 'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
            blocking: true,
            primary_node: {
              kind: 'class',
              name: 'AppShellViewModel',
              lines: [1],
            },
            related_nodes: [
              { kind: 'property', name: 'shared singleton', lines: [2] },
              { kind: 'call', name: 'URLSession.shared', lines: [4] },
            ],
            why: 'Rompe SRP y Clean Architecture.',
            impact: 'Acopla presentation a infraestructura.',
            expected_fix: 'Extraer collaborators.',
          },
        ],
        detectedPlatforms: {
          ios: { detected: true, confidence: 'HIGH' },
        },
        loadedRulesets: [{ platform: 'ios', bundle: 'iosEnterpriseRuleSet', hash: 'hash-ios' }],
      });

      assert.equal(result.evidence.snapshot.findings[0]?.blocking, true);
      assert.equal(result.evidence.snapshot.findings[0]?.primary_node?.name, 'AppShellViewModel');
      assert.equal(result.write.ok, true);

      const persisted = JSON.parse(readFileSync(join(tempRoot, '.ai_evidence.json'), 'utf8')) as AiEvidenceV2_1;
      assert.equal(persisted.snapshot.findings[0]?.blocking, true);
      assert.equal(persisted.snapshot.findings[0]?.primary_node?.name, 'AppShellViewModel');
      assert.equal(persisted.ai_gate.violations[0]?.expected_fix, 'Extraer collaborators.');
    });
  });
});

test('generateEvidence persiste contrato SDD cuando se informa bloqueo de policy', async () => {
  await withTempDir('pumuki-generate-evidence-sdd-contract-', async (tempRoot) => {
    initGitRepo(tempRoot);
    await withCwd(tempRoot, async () => {
      const result = generateEvidence({
        stage: 'PRE_PUSH',
        gateOutcome: 'BLOCK',
        findings: [
          {
            ruleId: 'sdd.policy.blocked',
            severity: 'ERROR',
            code: 'SDD_VALIDATION_FAILED',
            message: 'OpenSpec validation failed',
            filePath: 'openspec/changes',
            matchedBy: 'SddPolicy',
            source: 'sdd-policy',
          },
        ],
        detectedPlatforms: {},
        loadedRulesets: [{ platform: 'policy', bundle: 'gate-policy.default.PRE_PUSH', hash: 'hash-policy' }],
        sddMetrics: {
          enforced: true,
          stage: 'PRE_PUSH',
          decision: {
            allowed: false,
            code: 'SDD_VALIDATION_FAILED',
            message: 'OpenSpec validation failed',
          },
        },
      });

      assert.equal(result.evidence.snapshot.findings[0]?.source, 'sdd-policy');
      assert.deepEqual(result.evidence.sdd_metrics, {
        enforced: true,
        stage: 'PRE_PUSH',
        decision: {
          allowed: false,
          code: 'SDD_VALIDATION_FAILED',
          message: 'OpenSpec validation failed',
        },
      });
      assert.equal(result.write.ok, true);

      const persisted = JSON.parse(readFileSync(join(tempRoot, '.ai_evidence.json'), 'utf8')) as AiEvidenceV2_1;
      assert.equal(persisted.snapshot.findings[0]?.source, 'sdd-policy');
      assert.equal(persisted.ai_gate.violations[0]?.source, 'sdd-policy');
      assert.deepEqual(persisted.sdd_metrics, {
        enforced: true,
        stage: 'PRE_PUSH',
        decision: {
          allowed: false,
          code: 'SDD_VALIDATION_FAILED',
          message: 'OpenSpec validation failed',
        },
      });
    });
  });
});
