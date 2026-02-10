import {
  SMOKE_BASELINE_FILE,
  SMOKE_RANGE_PAYLOAD_FILES,
  SMOKE_STAGED_ONLY_FILE,
  SMOKE_STAGED_ONLY_VIOLATION_FILE,
} from './package-install-smoke-fixtures-content-lib';
import { writeSmokeFixtureFile } from './package-install-smoke-fixtures-write-lib';

export const writeBaselineFile = (consumerRepo: string): void => {
  writeSmokeFixtureFile({
    consumerRepo,
    relativePath: SMOKE_BASELINE_FILE.path,
    content: SMOKE_BASELINE_FILE.content,
  });
};

export const writeRangePayloadFiles = (consumerRepo: string): void => {
  for (const [relativePath, content] of Object.entries(SMOKE_RANGE_PAYLOAD_FILES)) {
    writeSmokeFixtureFile({
      consumerRepo,
      relativePath,
      content,
    });
  }
};

export const writeStagedOnlyFile = (consumerRepo: string): string => {
  return writeSmokeFixtureFile({
    consumerRepo,
    relativePath: SMOKE_STAGED_ONLY_FILE.path,
    content: SMOKE_STAGED_ONLY_FILE.content,
  });
};

export const writeStagedOnlyViolationFile = (consumerRepo: string): string => {
  return writeSmokeFixtureFile({
    consumerRepo,
    relativePath: SMOKE_STAGED_ONLY_VIOLATION_FILE.path,
    content: SMOKE_STAGED_ONLY_VIOLATION_FILE.content,
  });
};
