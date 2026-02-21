import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from '../../../core/gate/Finding';
import { printGateFindings } from '../runPlatformGateOutput';

test('printGateFindings no emite logs cuando no hay findings', () => {
  const captured: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    captured.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stdout.write;

  try {
    printGateFindings([]);
  } finally {
    process.stdout.write = originalWrite;
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
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    captured.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stdout.write;

  try {
    printGateFindings(findings);
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.deepEqual(captured, ['R1: Primera alerta', 'R2: Segunda alerta']);
});
