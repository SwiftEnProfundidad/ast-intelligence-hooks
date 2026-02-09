import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDirectory } from './package-install-smoke-runner-common';

export const writeBaselineFile = (consumerRepo: string): void => {
  const relativePath = 'apps/backend/src/baseline.ts';
  const filePath = join(consumerRepo, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(
    filePath,
    ["export const baseline = (): string => 'ok';", ''].join('\n'),
    'utf8'
  );
};

export const writeRangePayloadFiles = (consumerRepo: string): void => {
  const files: Record<string, string> = {
    'apps/backend/src/range-smoke.ts': [
      'export const backendRangeSmoke = (): string => {',
      "  console.log('backend-range-smoke');",
      "  return 'ok';",
      '};',
      '',
    ].join('\n'),
    'apps/web/src/range-smoke.tsx': [
      'export function FrontendRangeSmoke(): string {',
      "  console.log('frontend-range-smoke');",
      "  return 'ok';",
      '}',
      '',
    ].join('\n'),
    'apps/android/app/src/main/java/com/example/RangeSmoke.kt': [
      'package com.example',
      '',
      'class RangeSmoke {',
      '  fun block(): String {',
      '    Thread.sleep(1000)',
      '    return "ok"',
      '  }',
      '}',
      '',
    ].join('\n'),
    'apps/ios/RangeSmoke.swift': [
      'import Foundation',
      '',
      'func rangeSmoke() -> String {',
      '  let value: String? = "ok"',
      '  return value!',
      '}',
      '',
    ].join('\n'),
  };

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = join(consumerRepo, relativePath);
    ensureDirectory(join(filePath, '..'));
    writeFileSync(filePath, content, 'utf8');
  }
};

export const writeStagedOnlyFile = (consumerRepo: string): string => {
  const relativePath = 'apps/backend/src/staged-smoke.ts';
  const filePath = join(consumerRepo, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(
    filePath,
    ['export const stagedSmoke = (): string => "ok";', ''].join('\n'),
    'utf8'
  );
  return relativePath;
};

export const writeStagedOnlyViolationFile = (consumerRepo: string): string => {
  const relativePath = 'apps/backend/src/staged-smoke.ts';
  const filePath = join(consumerRepo, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(
    filePath,
    [
      'export const stagedSmoke = (): string => {',
      "  console.log('backend-staged-smoke');",
      "  return 'ok';",
      '};',
      '',
    ].join('\n'),
    'utf8'
  );
  return relativePath;
};
