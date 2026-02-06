import { policyForPreCommit } from '../gate/stagePolicies';
import { runPlatformGate } from './runPlatformGate';

export async function runPreCommitBackend(): Promise<number> {
  return runPlatformGate({
    policy: policyForPreCommit(),
    scope: {
      kind: 'staged',
    },
  });
}
