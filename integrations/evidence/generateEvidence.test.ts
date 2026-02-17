import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
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
