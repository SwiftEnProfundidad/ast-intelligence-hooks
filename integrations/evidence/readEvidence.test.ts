import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../__tests__/helpers/tempDir';
import type { AiEvidenceV2_1 } from './schema';
import { readEvidence, readEvidenceResult } from './readEvidence';

const sampleEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-17T00:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'PASS',
    findings: [],
  },
  ledger: [],
  platforms: {},
  rulesets: [],
  human_intent: null,
  ai_gate: {
    status: 'ALLOWED',
    violations: [],
    human_intent: null,
  },
  severity_metrics: {
    gate_status: 'ALLOWED',
    total_violations: 0,
    by_severity: {
      CRITICAL: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0,
    },
  },
});

test('readEvidenceResult devuelve missing cuando no existe .ai_evidence.json', async () => {
  await withTempDir('pumuki-read-evidence-missing-', async (tempRoot) => {
    const result = readEvidenceResult(tempRoot);
    assert.deepEqual(result, { kind: 'missing' });
    assert.equal(readEvidence(tempRoot), undefined);
  });
});

test('readEvidenceResult devuelve valid cuando el archivo tiene version 2.1', async () => {
  await withTempDir('pumuki-read-evidence-valid-', async (tempRoot) => {
    const evidence = sampleEvidence();
    writeFileSync(join(tempRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const result = readEvidenceResult(tempRoot);
    assert.equal(result.kind, 'valid');
    if (result.kind === 'valid') {
      assert.deepEqual(result.evidence, evidence);
    }
    assert.deepEqual(readEvidence(tempRoot), evidence);
  });
});

test('readEvidenceResult preserva contrato SDD (sdd_metrics + source sdd-policy)', async () => {
  await withTempDir('pumuki-read-evidence-sdd-contract-', async (tempRoot) => {
    const evidence = sampleEvidence();
    evidence.snapshot.stage = 'PRE_PUSH';
    evidence.snapshot.outcome = 'BLOCK';
    evidence.snapshot.findings = [
      {
        ruleId: 'sdd.policy.blocked',
        severity: 'ERROR',
        code: 'SDD_VALIDATION_FAILED',
        message: 'OpenSpec validation failed',
        file: 'openspec/changes',
        matchedBy: 'SddPolicy',
        source: 'sdd-policy',
      },
    ];
    evidence.ledger = [
      {
        ruleId: 'sdd.policy.blocked',
        file: 'openspec/changes',
        firstSeen: '2026-02-18T10:00:00.000Z',
        lastSeen: '2026-02-18T10:01:00.000Z',
      },
    ];
    evidence.ai_gate.status = 'BLOCKED';
    evidence.ai_gate.violations = [
      {
        ruleId: 'sdd.policy.blocked',
        level: 'ERROR',
        code: 'SDD_VALIDATION_FAILED',
        message: 'OpenSpec validation failed',
        file: 'openspec/changes',
        matchedBy: 'SddPolicy',
        source: 'sdd-policy',
      },
    ];
    evidence.severity_metrics.gate_status = 'BLOCKED';
    evidence.severity_metrics.total_violations = 1;
    evidence.severity_metrics.by_severity.ERROR = 1;
    evidence.sdd_metrics = {
      enforced: true,
      stage: 'PRE_PUSH',
      decision: {
        allowed: false,
        code: 'SDD_VALIDATION_FAILED',
        message: 'OpenSpec validation failed',
      },
    };

    writeFileSync(join(tempRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const result = readEvidenceResult(tempRoot);
    assert.equal(result.kind, 'valid');
    if (result.kind === 'valid') {
      assert.equal(result.evidence.snapshot.findings[0]?.source, 'sdd-policy');
      assert.equal(result.evidence.ai_gate.violations[0]?.source, 'sdd-policy');
      assert.deepEqual(result.evidence.sdd_metrics, evidence.sdd_metrics);
    }
  });
});

test('readEvidenceResult devuelve invalid y versión cuando el schema es de otra versión', async () => {
  await withTempDir('pumuki-read-evidence-invalid-version-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, '.ai_evidence.json'),
      JSON.stringify({ version: '2.0', payload: {} }, null, 2),
      'utf8'
    );

    const result = readEvidenceResult(tempRoot);
    assert.deepEqual(result, { kind: 'invalid', version: '2.0' });
    assert.equal(readEvidence(tempRoot), undefined);
  });
});

test('readEvidenceResult devuelve invalid sin versión cuando version no es string', async () => {
  await withTempDir('pumuki-read-evidence-invalid-version-type-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, '.ai_evidence.json'),
      JSON.stringify({ version: 21, payload: {} }, null, 2),
      'utf8'
    );

    const result = readEvidenceResult(tempRoot);
    assert.deepEqual(result, { kind: 'invalid', version: undefined });
    assert.equal(readEvidence(tempRoot), undefined);
  });
});

test('readEvidenceResult devuelve invalid sin versión cuando falta el campo version', async () => {
  await withTempDir('pumuki-read-evidence-missing-version-', async (tempRoot) => {
    writeFileSync(join(tempRoot, '.ai_evidence.json'), JSON.stringify({ payload: {} }, null, 2), 'utf8');

    const result = readEvidenceResult(tempRoot);
    assert.deepEqual(result, { kind: 'invalid', version: undefined });
    assert.equal(readEvidence(tempRoot), undefined);
  });
});

test('readEvidenceResult devuelve invalid para JSON corrupto', async () => {
  await withTempDir('pumuki-read-evidence-corrupt-', async (tempRoot) => {
    writeFileSync(join(tempRoot, '.ai_evidence.json'), '{ invalid json', 'utf8');

    const result = readEvidenceResult(tempRoot);
    assert.deepEqual(result, { kind: 'invalid' });
    assert.equal(readEvidence(tempRoot), undefined);
  });
});
