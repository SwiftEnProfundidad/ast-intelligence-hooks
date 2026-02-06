import { policyForPreCommit } from '../gate/stagePolicies';
import { runPlatformGate } from './runPlatformGate';

export async function runPreCommitAndroid(): Promise<number> {
  return runPlatformGate({
    policy: policyForPreCommit(),
    scope: {
      kind: 'staged',
    },
  });
}
