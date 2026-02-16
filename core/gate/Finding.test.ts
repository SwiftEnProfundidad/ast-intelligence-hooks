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
