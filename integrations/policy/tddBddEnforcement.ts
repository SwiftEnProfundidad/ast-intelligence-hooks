import type { Finding } from '../../core/gate/Finding';
import type { TddBddEnforcementResult } from '../tdd/enforcement';
import type { TddBddSnapshot } from '../tdd/types';

export type TddBddEnforcementMode = 'advisory' | 'strict';

export type TddBddEnforcementResolution = {
  mode: TddBddEnforcementMode;
  source: 'default' | 'env';
  blocking: boolean;
};

const TDD_BDD_ENFORCEMENT_ENV = 'PUMUKI_TDD_BDD_ENFORCEMENT';

const toTddBddEnforcementMode = (
  value: string | undefined
): TddBddEnforcementMode | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'strict'
    || normalized === '1'
    || normalized === 'true'
    || normalized === 'yes'
    || normalized === 'on'
  ) {
    return 'strict';
  }
  if (
    normalized === 'advisory'
    || normalized === 'warn'
    || normalized === 'warning'
    || normalized === '0'
    || normalized === 'false'
    || normalized === 'no'
    || normalized === 'off'
  ) {
    return 'advisory';
  }
  return null;
};

export const resolveTddBddEnforcement = (): TddBddEnforcementResolution => {
  const modeFromEnv = toTddBddEnforcementMode(process.env[TDD_BDD_ENFORCEMENT_ENV]);
  if (modeFromEnv) {
    return {
      mode: modeFromEnv,
      source: 'env',
      blocking: modeFromEnv === 'strict',
    };
  }
  return {
    mode: 'advisory',
    source: 'default',
    blocking: false,
  };
};

const applyTddBddFindingEnforcement = (
  finding: Finding,
  resolution: TddBddEnforcementResolution
): Finding => {
  if (resolution.blocking) {
    return finding;
  }
  if (finding.severity !== 'ERROR' && finding.severity !== 'CRITICAL') {
    return finding;
  }
  return {
    ...finding,
    severity: 'WARN',
  };
};

const applyTddBddSnapshotEnforcement = (
  snapshot: TddBddSnapshot,
  resolution: TddBddEnforcementResolution
): TddBddSnapshot => {
  if (resolution.blocking || snapshot.status !== 'blocked') {
    return snapshot;
  }
  return {
    ...snapshot,
    status: 'advisory',
  };
};

export const applyTddBddEnforcement = (
  result: TddBddEnforcementResult,
  resolution: TddBddEnforcementResolution = resolveTddBddEnforcement()
): TddBddEnforcementResult => {
  if (resolution.blocking) {
    return result;
  }
  return {
    findings: result.findings.map((finding) =>
      applyTddBddFindingEnforcement(finding, resolution)
    ),
    snapshot: applyTddBddSnapshotEnforcement(result.snapshot, resolution),
  };
};
