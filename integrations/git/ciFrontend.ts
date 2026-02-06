import { policyForCI } from '../gate/stagePolicies';
import { resolveCiBaseRef } from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';

export async function runCiFrontend(): Promise<number> {
  return runPlatformGate({
    policy: policyForCI(),
    scope: {
      kind: 'range',
      fromRef: resolveCiBaseRef(),
      toRef: 'HEAD',
    },
  });
}
