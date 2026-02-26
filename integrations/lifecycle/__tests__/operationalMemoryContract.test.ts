import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  OPERATIONAL_MEMORY_CONTRACT_CANONICAL_VERSION,
  OPERATIONAL_MEMORY_CONTRACT_SUPPORTED_VERSIONS,
  createOperationalMemoryContract,
  createOperationalMemoryContractHash,
  createOperationalMemorySignalFingerprint,
  dedupeOperationalMemoryRecords,
  parseOperationalMemoryContract,
  readOperationalMemoryContract,
  resolveOperationalMemoryContractPath,
  writeOperationalMemoryContract,
  type OperationalMemoryContractBodyCompat,
  type OperationalMemoryContractBodyV1,
} from '../operationalMemoryContract';

const signalHashA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const signalHashB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const signatureA = '1111111111111111111111111111111111111111111111111111111111111111';
const signatureB = '2222222222222222222222222222222222222222222222222222222222222222';

test('createOperationalMemoryContract crea contrato v1 con integridad valida', () => {
  const contract = createOperationalMemoryContract({
    producerVersion: '6.3.17',
    sourceMode: 'ci',
    generatedAt: '2026-02-26T23:00:00+00:00',
    scopeId: 'repo:ast-intelligence-hooks',
    scopeType: 'repository',
    ttlDays: 30,
    minConfidence: 0.6,
    records: [
      {
        recordId: 'rec-001',
        signalType: 'gate.findings.delta',
        signalHash: signalHashA,
        summary: 'critical findings reduced in backend module',
        confidence: 0.9,
        createdAt: '2026-02-26T22:55:00+00:00',
        expiresAt: '2026-03-28T22:55:00+00:00',
        signature: signatureA,
      },
      {
        recordId: 'rec-002',
        signalType: 'typecheck.regression',
        signalHash: signalHashB,
        summary: 'typecheck instability detected in cli path',
        confidence: 0.7,
        createdAt: '2026-02-26T22:56:00+00:00',
        expiresAt: '2026-03-28T22:56:00+00:00',
        signature: signatureB,
      },
    ],
  });

  assert.equal(contract.version, '1');
  assert.equal(contract.source.producer, 'pumuki');
  assert.equal(contract.scope.scope_type, 'repository');
  assert.equal(contract.records.length, 2);
  assert.match(contract.integrity.payload_hash, /^[a-f0-9]{64}$/);

  const parsed = parseOperationalMemoryContract(contract);
  assert.equal(parsed.kind, 'valid');
  if (parsed.kind === 'valid') {
    assert.equal(parsed.contract.records[0]?.record_id, 'rec-001');
  }
});

test('createOperationalMemoryContractHash es determinista para payload equivalente', () => {
  const bodyA: OperationalMemoryContractBodyV1 = {
    version: '1',
    generated_at: '2026-02-26T23:00:00+00:00',
    source: {
      producer: 'pumuki',
      producer_version: '6.3.17',
      mode: 'ci',
    },
    scope: {
      scope_id: 'repo:ast-intelligence-hooks',
      scope_type: 'repository',
      scope_name: 'ast-intelligence-hooks',
    },
    policy: {
      ttl_days: 30,
      min_confidence: 0.6,
    },
    records: [
      {
        record_id: 'rec-002',
        signal_type: 'typecheck.regression',
        signal_hash: signalHashB,
        summary: 'typecheck instability detected in cli path',
        confidence: 0.7,
        created_at: '2026-02-26T22:56:00+00:00',
        expires_at: '2026-03-28T22:56:00+00:00',
        signature: signatureB,
      },
      {
        record_id: 'rec-001',
        signal_type: 'gate.findings.delta',
        signal_hash: signalHashA,
        summary: 'critical findings reduced in backend module',
        confidence: 0.9,
        created_at: '2026-02-26T22:55:00+00:00',
        expires_at: '2026-03-28T22:55:00+00:00',
        signature: signatureA,
      },
    ],
  };

  const bodyB: OperationalMemoryContractBodyV1 = {
    records: [
      {
        record_id: 'rec-001',
        signal_type: 'gate.findings.delta',
        signal_hash: signalHashA,
        summary: 'critical findings reduced in backend module',
        confidence: 0.9,
        created_at: '2026-02-26T22:55:00+00:00',
        expires_at: '2026-03-28T22:55:00+00:00',
        signature: signatureA,
      },
      {
        record_id: 'rec-002',
        signal_type: 'typecheck.regression',
        signal_hash: signalHashB,
        summary: 'typecheck instability detected in cli path',
        confidence: 0.7,
        created_at: '2026-02-26T22:56:00+00:00',
        expires_at: '2026-03-28T22:56:00+00:00',
        signature: signatureB,
      },
    ],
    policy: {
      min_confidence: 0.6,
      ttl_days: 30,
    },
    scope: {
      scope_name: 'ast-intelligence-hooks',
      scope_type: 'repository',
      scope_id: 'repo:ast-intelligence-hooks',
    },
    source: {
      mode: 'ci',
      producer_version: '6.3.17',
      producer: 'pumuki',
    },
    generated_at: '2026-02-26T23:00:00+00:00',
    version: '1',
  };

  assert.equal(createOperationalMemoryContractHash(bodyA), createOperationalMemoryContractHash(bodyB));
});

test('createOperationalMemorySignalFingerprint es determinista por señal', () => {
  const fingerprintA = createOperationalMemorySignalFingerprint({
    signalType: 'gate.findings.delta',
    signalHash: signalHashA,
  });
  const fingerprintB = createOperationalMemorySignalFingerprint({
    signalType: 'gate.findings.delta',
    signalHash: signalHashA.toUpperCase(),
  });
  const fingerprintC = createOperationalMemorySignalFingerprint({
    signalType: 'typecheck.regression',
    signalHash: signalHashA,
  });

  assert.equal(fingerprintA, fingerprintB);
  assert.notEqual(fingerprintA, fingerprintC);
});

test('dedupeOperationalMemoryRecords conserva una única entrada por señal y prioriza confianza', () => {
  const deduped = dedupeOperationalMemoryRecords([
    {
      record_id: 'rec-001',
      signal_type: 'gate.findings.delta',
      signal_hash: signalHashA,
      summary: 'first',
      confidence: 0.5,
      created_at: '2026-02-26T22:55:00+00:00',
      expires_at: '2026-03-28T22:55:00+00:00',
      signature: signatureA,
    },
    {
      record_id: 'rec-002',
      signal_type: 'gate.findings.delta',
      signal_hash: signalHashA,
      summary: 'second',
      confidence: 0.8,
      created_at: '2026-02-26T22:56:00+00:00',
      expires_at: '2026-03-28T22:56:00+00:00',
      signature: signatureB,
    },
  ]);

  assert.equal(deduped.length, 1);
  assert.equal(deduped[0]?.record_id, 'rec-002');
});

test('parseOperationalMemoryContract detecta tampering por hash', () => {
  const contract = createOperationalMemoryContract({
    producerVersion: '6.3.17',
    sourceMode: 'ci',
    generatedAt: '2026-02-26T23:00:00+00:00',
    scopeId: 'repo:ast-intelligence-hooks',
    scopeType: 'repository',
    ttlDays: 30,
    minConfidence: 0.6,
    records: [
      {
        recordId: 'rec-001',
        signalType: 'gate.findings.delta',
        signalHash: signalHashA,
        summary: 'critical findings reduced in backend module',
        confidence: 0.9,
        createdAt: '2026-02-26T22:55:00+00:00',
        expiresAt: '2026-03-28T22:55:00+00:00',
        signature: signatureA,
      },
    ],
  });

  const tampered = structuredClone(contract);
  tampered.records[0]!.confidence = 0.1;
  const parsed = parseOperationalMemoryContract(tampered);
  assert.equal(parsed.kind, 'invalid');
  if (parsed.kind === 'invalid') {
    assert.equal(parsed.reason, 'integrity_hash_mismatch');
    assert.equal(parsed.version, '1');
  }
});

test('createOperationalMemoryContract deduplica señales equivalentes al construir el contrato', () => {
  const contract = createOperationalMemoryContract({
    producerVersion: '6.3.17',
    sourceMode: 'ci',
    generatedAt: '2026-02-26T23:00:00+00:00',
    scopeId: 'repo:ast-intelligence-hooks',
    scopeType: 'repository',
    ttlDays: 30,
    minConfidence: 0.6,
    records: [
      {
        recordId: 'rec-001',
        signalType: 'gate.findings.delta',
        signalHash: signalHashA,
        summary: 'first',
        confidence: 0.5,
        createdAt: '2026-02-26T22:55:00+00:00',
        expiresAt: '2026-03-28T22:55:00+00:00',
        signature: signatureA,
      },
      {
        recordId: 'rec-002',
        signalType: 'gate.findings.delta',
        signalHash: signalHashA,
        summary: 'second',
        confidence: 0.8,
        createdAt: '2026-02-26T22:56:00+00:00',
        expiresAt: '2026-03-28T22:56:00+00:00',
        signature: signatureB,
      },
    ],
  });

  assert.equal(contract.records.length, 1);
  assert.equal(contract.records[0]?.record_id, 'rec-002');
});

test('parseOperationalMemoryContract soporta payload legacy v1.0 y canoniza a v1', () => {
  const canonical = createOperationalMemoryContract({
    producerVersion: '6.3.17',
    sourceMode: 'ci',
    generatedAt: '2026-02-26T23:00:00+00:00',
    scopeId: 'repo:ast-intelligence-hooks',
    scopeType: 'repository',
    ttlDays: 30,
    minConfidence: 0.6,
    records: [
      {
        recordId: 'rec-001',
        signalType: 'gate.findings.delta',
        signalHash: signalHashA,
        summary: 'critical findings reduced in backend module',
        confidence: 0.9,
        createdAt: '2026-02-26T22:55:00+00:00',
        expiresAt: '2026-03-28T22:55:00+00:00',
        signature: signatureA,
      },
    ],
  });
  const { integrity: _ignore, ...bodyOnly } = canonical;

  const legacyBody: OperationalMemoryContractBodyCompat = {
    ...bodyOnly,
    version: '1.0',
  };
  const legacyPayload = {
    ...legacyBody,
    integrity: {
      algorithm: 'sha256' as const,
      payload_hash: createOperationalMemoryContractHash(legacyBody),
    },
  };

  const parsed = parseOperationalMemoryContract(legacyPayload);
  assert.equal(parsed.kind, 'valid');
  if (parsed.kind === 'valid') {
    assert.equal(parsed.integrity.source_version, '1.0');
    assert.equal(parsed.contract.version, OPERATIONAL_MEMORY_CONTRACT_CANONICAL_VERSION);
  }
  assert.deepEqual(OPERATIONAL_MEMORY_CONTRACT_SUPPORTED_VERSIONS, ['1', '1.0']);
});

test('readOperationalMemoryContract devuelve missing cuando no existe contrato', async () => {
  await withTempDir('pumuki-operational-memory-read-missing-', async (tempRoot) => {
    const previous = process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH;
    process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH = '.pumuki/artifacts/contract.json';
    try {
      const result = readOperationalMemoryContract(tempRoot);
      assert.equal(result.kind, 'missing');
      if (result.kind === 'missing') {
        assert.equal(result.path, join(tempRoot, '.pumuki', 'artifacts', 'contract.json'));
      }
    } finally {
      if (typeof previous === 'string') {
        process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH = previous;
      } else {
        delete process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH;
      }
    }
  });
});

test('readOperationalMemoryContract devuelve valid para contrato integro', async () => {
  await withTempDir('pumuki-operational-memory-read-valid-', async (tempRoot) => {
    const previous = process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH;
    process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH = '.pumuki/artifacts/contract.json';
    try {
      const contract = createOperationalMemoryContract({
        producerVersion: '6.3.17',
        sourceMode: 'ci',
        generatedAt: '2026-02-26T23:00:00+00:00',
        scopeId: 'repo:ast-intelligence-hooks',
        scopeType: 'repository',
        ttlDays: 30,
        minConfidence: 0.6,
        records: [
          {
            recordId: 'rec-001',
            signalType: 'gate.findings.delta',
            signalHash: signalHashA,
            summary: 'critical findings reduced in backend module',
            confidence: 0.9,
            createdAt: '2026-02-26T22:55:00+00:00',
            expiresAt: '2026-03-28T22:55:00+00:00',
            signature: signatureA,
          },
        ],
      });
      const contractPath = resolveOperationalMemoryContractPath(tempRoot);
      mkdirSync(dirname(contractPath), { recursive: true });
      writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`, 'utf8');

      const result = readOperationalMemoryContract(tempRoot);
      assert.equal(result.kind, 'valid');
      if (result.kind === 'valid') {
        assert.equal(result.contract.version, '1');
        assert.equal(result.contract.records.length, 1);
      }
    } finally {
      if (typeof previous === 'string') {
        process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH = previous;
      } else {
        delete process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH;
      }
    }
  });
});

test('writeOperationalMemoryContract persiste de forma determinista y reutilizable por read', async () => {
  await withTempDir('pumuki-operational-memory-write-read-', async (tempRoot) => {
    const previous = process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH;
    process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH = '.pumuki/artifacts/contract.json';
    try {
      const contract = createOperationalMemoryContract({
        producerVersion: '6.3.17',
        sourceMode: 'ci',
        generatedAt: '2026-02-26T23:00:00+00:00',
        scopeId: 'repo:ast-intelligence-hooks',
        scopeType: 'repository',
        ttlDays: 30,
        minConfidence: 0.6,
        records: [
          {
            recordId: 'rec-001',
            signalType: 'gate.findings.delta',
            signalHash: signalHashA,
            summary: 'critical findings reduced in backend module',
            confidence: 0.9,
            createdAt: '2026-02-26T22:55:00+00:00',
            expiresAt: '2026-03-28T22:55:00+00:00',
            signature: signatureA,
          },
        ],
      });

      const writeResult = writeOperationalMemoryContract(tempRoot, contract);
      assert.equal(writeResult.path, resolveOperationalMemoryContractPath(tempRoot));
      assert.equal(writeResult.bytes > 0, true);

      const readResult = readOperationalMemoryContract(tempRoot);
      assert.equal(readResult.kind, 'valid');
      if (readResult.kind === 'valid') {
        assert.equal(readResult.contract.integrity.payload_hash, contract.integrity.payload_hash);
      }
    } finally {
      if (typeof previous === 'string') {
        process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH = previous;
      } else {
        delete process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH;
      }
    }
  });
});
