import { policyForPrePush } from '../gate/stagePolicies';
import { resolveUpstreamRef } from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';

export async function runPrePushFrontend(): Promise<number> {
  return runPlatformGate({
    policy: policyForPrePush(),
    scope: {
      kind: 'range',
      fromRef: resolveUpstreamRef(),
      toRef: 'HEAD',
    },
  });
}
