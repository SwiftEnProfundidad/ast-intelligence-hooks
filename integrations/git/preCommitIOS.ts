import { policyForPreCommit } from '../gate/stagePolicies';
import { runPlatformGate } from './runPlatformGate';

export async function runPreCommitIOS(): Promise<number> {
  return runPlatformGate({
    policy: policyForPreCommit(),
    scope: {
      kind: 'staged',
      extensions: ['.swift', '.ts'],
    },
  });
}
