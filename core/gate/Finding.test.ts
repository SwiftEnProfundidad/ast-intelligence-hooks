import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from './Finding';

test('Finding conserva campos requeridos y filePath opcional', () => {
  const findingWithPath: Finding = {
    ruleId: 'heuristics.ts.console-log.ast',
    severity: 'WARN',
    code: 'HEURISTICS_CONSOLE_LOG_AST',
    message: 'AST heuristic detected console.log usage.',
    filePath: 'apps/backend/src/main.ts',
  };
  const findingWithoutPath: Finding = {
    ruleId: 'gate.summary',
    severity: 'INFO',
    code: 'GATE_SUMMARY',
    message: 'Gate executed.',
  };

  assert.equal(findingWithPath.ruleId, 'heuristics.ts.console-log.ast');
  assert.equal(findingWithPath.severity, 'WARN');
  assert.equal(findingWithPath.filePath, 'apps/backend/src/main.ts');
  assert.equal(findingWithoutPath.filePath, undefined);
});

test('Finding admite metadata semantica enriquecida para hallazgos bloqueantes', () => {
  const finding: Finding = {
    ruleId: 'ios.canary-001.presentation-mixed-responsibilities',
    severity: 'CRITICAL',
    code: 'IOS_CANARY_001_PRESENTATION_MIXED_RESPONSIBILITIES',
    message: 'ViewModel mezcla responsabilidades.',
    filePath: 'apps/ios/AppShellViewModel.swift',
    blocking: true,
    primary_node: {
      kind: 'class',
      name: 'AppShellViewModel',
      lines: [1],
    },
    related_nodes: [
      { kind: 'property', name: 'shared singleton', lines: [2] },
      { kind: 'call', name: 'URLSession.shared', lines: [3] },
    ],
    why: 'Rompe SRP y Clean Architecture.',
    impact: 'Acopla presentation a infraestructura.',
    expected_fix: 'Extraer collaborators.',
  };

  assert.equal(finding.blocking, true);
  assert.equal(finding.primary_node?.name, 'AppShellViewModel');
  assert.equal(finding.related_nodes?.length, 2);
  assert.match(finding.why ?? '', /SRP/);
});

test('Finding permite representar severidades distintas', () => {
  const findings: Finding[] = [
    {
      ruleId: 'rule.info',
      severity: 'INFO',
      code: 'RULE_INFO',
      message: 'Info finding',
    },
    {
      ruleId: 'rule.error',
      severity: 'ERROR',
      code: 'RULE_ERROR',
      message: 'Error finding',
    },
    {
      ruleId: 'rule.critical',
      severity: 'CRITICAL',
      code: 'RULE_CRITICAL',
      message: 'Critical finding',
    },
  ];

  assert.deepEqual(
    findings.map((finding) => finding.severity),
    ['INFO', 'ERROR', 'CRITICAL']
  );
});
