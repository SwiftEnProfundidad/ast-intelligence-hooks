import type { GatePolicy } from '../../core/gate/GatePolicy';

export const policyForPreCommit = (): GatePolicy => {
  return {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  };
};

export const policyForPrePush = (): GatePolicy => {
  return {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
};
