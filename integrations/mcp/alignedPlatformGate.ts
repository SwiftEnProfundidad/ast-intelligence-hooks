import type { AiGateStage } from '../gate/evaluateAiGate';
import { resolvePolicyForStage } from '../gate/stagePolicies';
import type { SddDecision } from '../sdd';
import { GitService } from '../git/GitService';
import { runPlatformGate } from '../git/runPlatformGate';
import type { GateScope } from '../git/runPlatformGateFacts';
import { readMcpPrePushStdin } from './readMcpPrePushStdin';

const ZERO_HASH = /^0+$/;

const runGit = (repoRoot: string, args: ReadonlyArray<string>): string | null => {
  try {
    return new GitService().runGit(args, repoRoot).trim();
  } catch {
    return null;
  }
};

const resolveUpstreamRefInRepo = (repoRoot: string): string | null =>
  runGit(repoRoot, ['rev-parse', '@{u}']);

const resolveHeadOidInRepo = (repoRoot: string): string | null =>
  runGit(repoRoot, ['rev-parse', 'HEAD']);

const resolveCiBaseRefInRepo = (repoRoot: string): string => {
  const fromEnv = process.env.GITHUB_BASE_REF?.trim();
  if (fromEnv) {
    if (runGit(repoRoot, ['rev-parse', '--verify', fromEnv])) {
      return fromEnv;
    }
    const remoteRef = `origin/${fromEnv}`;
    if (runGit(repoRoot, ['rev-parse', '--verify', remoteRef])) {
      return remoteRef;
    }
  }

  for (const candidate of ['origin/main', 'main', 'HEAD']) {
    if (runGit(repoRoot, ['rev-parse', '--verify', candidate])) {
      return candidate;
    }
  }

  return 'HEAD';
};

const resolvePrePushBootstrapBaseRefInRepo = (repoRoot: string): string => {
  const candidates = ['origin/develop', 'develop', resolveCiBaseRefInRepo(repoRoot)];
  for (const candidate of candidates) {
    if (runGit(repoRoot, ['rev-parse', '--verify', candidate])) {
      return candidate;
    }
  }

  return 'HEAD';
};

const shouldAllowBootstrapPrePush = (rawInput: string): boolean => {
  const lines = rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const [localRef, localOid, remoteRef, remoteOid] = line.split(/\s+/);
    if (!localRef || !localOid || !remoteRef || !remoteOid) {
      continue;
    }
    const localIsBranch = localRef.startsWith('refs/heads/');
    const remoteIsBranch = remoteRef.startsWith('refs/heads/');
    const localIsDeletion = ZERO_HASH.test(localOid);
    const remoteIsNewBranch = ZERO_HASH.test(remoteOid);

    if (localIsBranch && remoteIsBranch && !localIsDeletion && remoteIsNewBranch) {
      return true;
    }
  }

  return false;
};

const resolveExplicitPrePushRange = (
  rawInput: string
): { fromRef: string; toRef: string } | undefined => {
  const lines = rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const eligibleRanges = lines
    .map((line) => {
      const [localRef, localOid, remoteRef, remoteOid] = line.split(/\s+/);
      if (!localRef || !localOid || !remoteRef || !remoteOid) {
        return undefined;
      }
      const localIsDeletion = ZERO_HASH.test(localOid);
      const remoteIsNewBranch = ZERO_HASH.test(remoteOid);
      if (localIsDeletion || remoteIsNewBranch) {
        return undefined;
      }
      return {
        fromRef: remoteOid,
        toRef: localOid,
      };
    })
    .filter((value): value is { fromRef: string; toRef: string } => Boolean(value));

  if (eligibleRanges.length !== 1) {
    return undefined;
  }

  return eligibleRanges[0];
};

type PrePushScopeResolution =
  | { kind: 'scope'; scope: GateScope; sddDecisionOverride?: Pick<SddDecision, 'allowed' | 'code' | 'message'> }
  | { kind: 'upstream_missing' };

const resolvePrePushScopeForMcp = (params: { repoRoot: string }): PrePushScopeResolution => {
  const prePushInput = readMcpPrePushStdin();
  const upstreamRef = resolveUpstreamRefInRepo(params.repoRoot);
  if (!upstreamRef) {
    const bootstrapBaseRef = resolvePrePushBootstrapBaseRefInRepo(params.repoRoot);
    const bootstrapByPrePushStdIn = shouldAllowBootstrapPrePush(prePushInput);
    const bootstrapByFallbackBase = !bootstrapByPrePushStdIn && bootstrapBaseRef !== 'HEAD';
    const manualInvocationFallback =
      !bootstrapByPrePushStdIn &&
      !bootstrapByFallbackBase &&
      prePushInput.trim().length === 0;
    if (bootstrapByPrePushStdIn || bootstrapByFallbackBase) {
      return {
        kind: 'scope',
        scope: {
          kind: 'range',
          fromRef: bootstrapBaseRef,
          toRef: 'HEAD',
        },
      };
    }
    if (manualInvocationFallback) {
      return { kind: 'scope', scope: { kind: 'workingTree' } };
    }
    return { kind: 'upstream_missing' };
  }
  const explicitPrePushRange = resolveExplicitPrePushRange(prePushInput);
  const prePushFromRef = explicitPrePushRange?.fromRef ?? upstreamRef;
  const prePushToRef = explicitPrePushRange?.toRef ?? 'HEAD';
  const headOid = resolveHeadOidInRepo(params.repoRoot);
  const sddDecisionOverride =
    explicitPrePushRange && headOid && explicitPrePushRange.toRef !== headOid
      ? ({
        allowed: true,
        code: 'ALLOWED',
        message:
          `SDD enforcement suspended for PRE_PUSH historical publish targeting ${explicitPrePushRange.toRef.slice(0, 12)} ` +
          `instead of current HEAD ${headOid.slice(0, 12)}.`,
      } as Pick<SddDecision, 'allowed' | 'code' | 'message'>)
      : undefined;
  return {
    kind: 'scope',
    scope: {
      kind: 'range',
      fromRef: prePushFromRef,
      toRef: prePushToRef,
    },
    sddDecisionOverride,
  };
};

type RunAlignedParams = {
  repoRoot: string;
  stage: AiGateStage;
};

export const runMcpAlignedPlatformGate = async (
  params: RunAlignedParams
): Promise<{ exitCode: number; aligned: boolean; skipReason: string | null }> => {
  const git = new GitService();
  const resolved = resolvePolicyForStage(params.stage, params.repoRoot);
  if (params.stage === 'PRE_WRITE') {
    const exitCode = await runPlatformGate({
      policy: resolved.policy,
      policyTrace: resolved.trace,
      scope: { kind: 'workingTree' },
      silent: true,
      services: { git },
    });
    return { exitCode, aligned: true, skipReason: null };
  }
  if (params.stage === 'PRE_COMMIT') {
    const exitCode = await runPlatformGate({
      policy: resolved.policy,
      policyTrace: resolved.trace,
      scope: { kind: 'staged' },
      silent: true,
      services: { git },
    });
    return { exitCode, aligned: true, skipReason: null };
  }
  if (params.stage === 'CI') {
    const ciBaseRef = resolveCiBaseRefInRepo(params.repoRoot);
    const exitCode = await runPlatformGate({
      policy: resolved.policy,
      policyTrace: resolved.trace,
      scope: {
        kind: 'range',
        fromRef: ciBaseRef,
        toRef: 'HEAD',
      },
      silent: true,
      services: { git },
    });
    return { exitCode, aligned: true, skipReason: null };
  }
  if (params.stage === 'PRE_PUSH') {
    const scopeResolution = resolvePrePushScopeForMcp({ repoRoot: params.repoRoot });
    if (scopeResolution.kind === 'upstream_missing') {
      return { exitCode: 1, aligned: false, skipReason: 'PRE_PUSH_UPSTREAM_MISSING' };
    }
    const exitCode = await runPlatformGate({
      policy: resolved.policy,
      policyTrace: resolved.trace,
      scope: scopeResolution.scope,
      silent: true,
      services: { git },
      ...(scopeResolution.sddDecisionOverride
        ? { sddDecisionOverride: scopeResolution.sddDecisionOverride }
        : {}),
    });
    return { exitCode, aligned: true, skipReason: null };
  }
  throw new Error(`Unsupported MCP aligned stage: ${String(params.stage)}`);
};
