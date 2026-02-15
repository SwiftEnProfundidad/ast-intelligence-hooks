import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from '../../../core/gate/Finding';
import { printGateFindings } from '../runPlatformGateOutput';

test('printGateFindings no emite logs cuando no hay findings', () => {
  const captured: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): void => {
    captured.push(args.join(' '));
  };

  try {
    printGateFindings([]);
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(captured, []);
});

test('printGateFindings imprime ruleId y message por cada finding', () => {
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'R1',
      severity: 'ERROR',
      code: 'sample-1',
      message: 'Primera alerta',
      filePath: 'src/a.ts',
    },
    {
      ruleId: 'R2',
      severity: 'WARN',
      code: 'sample-2',
      message: 'Segunda alerta',
      filePath: 'src/b.ts',
    },
  ];
  const captured: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): void => {
    captured.push(args.join(' '));
  };

  try {
    printGateFindings(findings);
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(captured, ['R1: Primera alerta', 'R2: Segunda alerta']);
});
