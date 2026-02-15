import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { EvidenceService } from '../EvidenceService';

const service = new EvidenceService();

const withTempDir = async (callback: (dir: string) => void): Promise<void> => {
  const dir = mkdtempSync(join(tmpdir(), 'pumuki-evidence-test-'));
  try {
    callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('loadPreviousEvidence returns undefined when file does not exist', async () => {
  await withTempDir((dir) => {
    const result = service.loadPreviousEvidence(dir);
    assert.equal(result, undefined);
  });
});

test('loadPreviousEvidence returns undefined for invalid JSON', async () => {
  await withTempDir((dir) => {
    writeFileSync(join(dir, '.ai_evidence.json'), 'not json', 'utf8');
    const result = service.loadPreviousEvidence(dir);
    assert.equal(result, undefined);
  });
});

test('loadPreviousEvidence returns undefined for wrong version', async () => {
  await withTempDir((dir) => {
    writeFileSync(
      join(dir, '.ai_evidence.json'),
      JSON.stringify({ version: '1.0', snapshot: {}, ledger: [] }),
      'utf8'
    );
    const result = service.loadPreviousEvidence(dir);
    assert.equal(result, undefined);
  });
});

test('loadPreviousEvidence returns evidence for valid v2.1', async () => {
  await withTempDir((dir) => {
    const evidence = {
      version: '2.1',
      timestamp: '2026-01-01T00:00:00Z',
      snapshot: { stage: 'PRE_COMMIT', outcome: 'PASS', findings: [] },
      ledger: [],
      platforms: {},
      rulesets: [],
      human_intent: null,
      ai_gate: { status: 'ALLOWED', violations: [], human_intent: null },
      severity_metrics: { gate_status: 'ALLOWED', total_violations: 0, by_severity: {} },
    };
    writeFileSync(join(dir, '.ai_evidence.json'), JSON.stringify(evidence), 'utf8');
    const result = service.loadPreviousEvidence(dir);
    assert.ok(result);
    assert.equal(result.version, '2.1');
    assert.equal(result.timestamp, '2026-01-01T00:00:00Z');
  });
});

test('toDetectedPlatformsRecord filters out falsy entries', () => {
  const detected = {
    ios: { detected: true as const, confidence: 'HIGH' as const },
    backend: false as const,
    frontend: false as const,
    android: false as const,
  } satisfies ReturnType<typeof import('../../../integrations/platform/detectPlatforms').detectPlatformsFromFacts>;
  const result = service.toDetectedPlatformsRecord(detected);
  assert.deepEqual(Object.keys(result), ['ios']);
  assert.deepEqual(result.ios, { detected: true, confidence: 'HIGH' });
});

test('toDetectedPlatformsRecord returns empty record when nothing detected', () => {
  const detected = {
    ios: false as const,
    backend: false as const,
    frontend: false as const,
    android: false as const,
  } satisfies ReturnType<typeof import('../../../integrations/platform/detectPlatforms').detectPlatformsFromFacts>;
  const result = service.toDetectedPlatformsRecord(detected);
  assert.deepEqual(result, {});
});

import type { RuleDefinition } from '../../../core/rules/RuleDefinition';

const FAKE_RULE: RuleDefinition = {
  id: 'fake.rule',
  description: 'test',
  severity: 'WARN',
  platform: 'generic',
  when: { kind: 'FileContent', contains: ['test'] },
  then: { kind: 'Finding', message: 'test' },
};

test('buildRulesetState returns empty array when no baseline and no rules', () => {
  const result = service.buildRulesetState({
    baselineRuleSets: [],
    projectRules: [],
    heuristicRules: [],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [],
    stage: 'PRE_COMMIT',
  });
  assert.deepEqual(result, []);
});

test('buildRulesetState includes baseline ruleset entries', () => {
  const result = service.buildRulesetState({
    baselineRuleSets: [
      { platform: 'ios', bundle: 'iosEnterpriseRuleSet@1.0.0', rules: [FAKE_RULE] },
    ],
    projectRules: [],
    heuristicRules: [],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [],
    stage: 'PRE_COMMIT',
  });
  const iosEntry = result.find((r) => r.platform === 'ios');
  assert.ok(iosEntry);
  assert.equal(iosEntry.bundle, 'iosEnterpriseRuleSet@1.0.0');
  assert.match(iosEntry.hash, /^[a-f0-9]{64}$/);
});

test('buildRulesetState includes multiple baseline rulesets', () => {
  const result = service.buildRulesetState({
    baselineRuleSets: [
      { platform: 'ios', bundle: 'iosEnterpriseRuleSet@1.0.0', rules: [FAKE_RULE] },
      { platform: 'backend', bundle: 'backendRuleSet@2.0.0', rules: [FAKE_RULE] },
    ],
    projectRules: [],
    heuristicRules: [],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [],
    stage: 'PRE_COMMIT',
  });
  assert.equal(result.filter((r) => r.platform === 'ios').length, 1);
  assert.equal(result.filter((r) => r.platform === 'backend').length, 1);
});

test('buildRulesetState includes project rules when present', () => {
  const result = service.buildRulesetState({
    baselineRuleSets: [],
    projectRules: [FAKE_RULE],
    heuristicRules: [],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [],
    stage: 'PRE_COMMIT',
  });
  const projectEntry = result.find((r) => r.platform === 'project');
  assert.ok(projectEntry);
  assert.equal(projectEntry.bundle, 'project-rules');
  assert.match(projectEntry.hash, /^[a-f0-9]{64}$/);
});

test('buildRulesetState includes heuristic rules with provided bundle name', () => {
  const result = service.buildRulesetState({
    baselineRuleSets: [],
    projectRules: [],
    heuristicRules: [FAKE_RULE],
    heuristicsBundle: 'astHeuristicsRuleSet@3.5.0',
    skillsBundles: [],
    stage: 'PRE_COMMIT',
  });
  const heuristicsEntry = result.find((r) => r.platform === 'heuristics');
  assert.ok(heuristicsEntry);
  assert.equal(heuristicsEntry.bundle, 'astHeuristicsRuleSet@3.5.0');
  assert.match(heuristicsEntry.hash, /^[a-f0-9]{64}$/);
});

test('buildRulesetState heuristic hash differs by stage', () => {
  const baseParams = {
    baselineRuleSets: [] as [],
    projectRules: [] as [],
    heuristicRules: [FAKE_RULE],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [] as [],
  };
  const preCommitResult = service.buildRulesetState({ ...baseParams, stage: 'PRE_COMMIT' });
  const ciResult = service.buildRulesetState({ ...baseParams, stage: 'CI' });
  const preCommitHash = preCommitResult.find((r) => r.platform === 'heuristics')?.hash;
  const ciHash = ciResult.find((r) => r.platform === 'heuristics')?.hash;
  assert.ok(preCommitHash);
  assert.ok(ciHash);
  assert.notEqual(preCommitHash, ciHash);
});

test('buildRulesetState includes skills bundles', () => {
  const result = service.buildRulesetState({
    baselineRuleSets: [],
    projectRules: [],
    heuristicRules: [],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [
      { name: 'my-skill', version: '1.0.0', hash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd1234' },
    ],
    stage: 'PRE_COMMIT',
  });
  const skillsEntry = result.find((r) => r.platform === 'skills');
  assert.ok(skillsEntry);
  assert.equal(skillsEntry.bundle, 'my-skill@1.0.0');
});

test('buildRulesetState includes policy trace when provided', () => {
  const result = service.buildRulesetState({
    baselineRuleSets: [],
    projectRules: [],
    heuristicRules: [],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [],
    stage: 'PRE_COMMIT',
    policyTrace: {
      source: 'default' as const,
      bundle: 'gate-policy.skills.policy.PRE_COMMIT',
      hash: 'deadbeef'.repeat(8),
    },
  });
  const policyEntry = result.find((r) => r.platform === 'policy');
  assert.ok(policyEntry);
  assert.equal(policyEntry.bundle, 'gate-policy.skills.policy.PRE_COMMIT');
  assert.equal(policyEntry.hash, 'deadbeef'.repeat(8));
});

test('buildRulesetState produces deterministic hashes for same input', () => {
  const params = {
    baselineRuleSets: [
      { platform: 'ios', bundle: 'iosEnterpriseRuleSet@1.0.0', rules: [FAKE_RULE] },
    ] as const,
    projectRules: [] as [],
    heuristicRules: [] as [],
    heuristicsBundle: 'astHeuristicsRuleSet@1.0.0',
    skillsBundles: [] as [],
    stage: 'PRE_COMMIT' as const,
  };
  const result1 = service.buildRulesetState(params);
  const result2 = service.buildRulesetState(params);
  assert.deepEqual(result1, result2);
});
