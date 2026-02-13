import { createHash } from 'node:crypto';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
import type { RuleSet } from '../../core/rules/RuleSet';
import {
  createSkillsPolicyDeterministicHash,
  loadSkillsPolicy,
} from '../config/skillsPolicy';
import type { SkillsStage } from '../config/skillsLock';

const promotedHeuristicRuleIds = new Set<string>([
  'heuristics.ts.console-log.ast',
  'heuristics.ts.console-error.ast',
  'heuristics.ts.eval.ast',
  'heuristics.ts.function-constructor.ast',
  'heuristics.ts.set-timeout-string.ast',
  'heuristics.ts.set-interval-string.ast',
  'heuristics.ts.new-promise-async.ast',
  'heuristics.ts.with-statement.ast',
  'heuristics.ts.process-exit.ast',
  'heuristics.ts.delete-operator.ast',
  'heuristics.ts.inner-html.ast',
  'heuristics.ts.document-write.ast',
  'heuristics.ts.insert-adjacent-html.ast',
  'heuristics.ts.child-process-import.ast',
  'heuristics.ts.process-env-mutation.ast',
  'heuristics.ts.fs-write-file-sync.ast',
  'heuristics.ts.child-process-exec-sync.ast',
  'heuristics.ts.child-process-exec.ast',
  'heuristics.ts.child-process-spawn-sync.ast',
  'heuristics.ts.child-process-spawn.ast',
  'heuristics.ts.child-process-fork.ast',
  'heuristics.ts.child-process-exec-file-sync.ast',
  'heuristics.ts.fs-append-file-sync.ast',
  'heuristics.ts.fs-promises-write-file.ast',
  'heuristics.ts.fs-promises-append-file.ast',
  'heuristics.ts.fs-promises-rm.ast',
  'heuristics.ts.fs-promises-unlink.ast',
  'heuristics.ts.fs-promises-read-file.ast',
  'heuristics.ts.fs-promises-readdir.ast',
  'heuristics.ts.fs-promises-mkdir.ast',
  'heuristics.ts.fs-promises-stat.ast',
  'heuristics.ts.fs-promises-copy-file.ast',
  'heuristics.ts.fs-promises-rename.ast',
  'heuristics.ts.fs-promises-access.ast',
  'heuristics.ts.fs-promises-chmod.ast',
  'heuristics.ts.fs-promises-chown.ast',
  'heuristics.ts.fs-promises-utimes.ast',
  'heuristics.ts.fs-promises-lstat.ast',
  'heuristics.ts.fs-promises-realpath.ast',
  'heuristics.ts.fs-promises-symlink.ast',
  'heuristics.ts.fs-promises-link.ast',
  'heuristics.ts.fs-promises-readlink.ast',
  'heuristics.ts.fs-promises-open.ast',
  'heuristics.ts.fs-promises-opendir.ast',
  'heuristics.ts.fs-promises-cp.ast',
  'heuristics.ts.fs-promises-mkdtemp.ast',
  'heuristics.ts.fs-utimes-callback.ast',
  'heuristics.ts.fs-watch-callback.ast',
  'heuristics.ts.fs-watch-file-callback.ast',
  'heuristics.ts.fs-unwatch-file-callback.ast',
  'heuristics.ts.fs-read-file-callback.ast',
  'heuristics.ts.fs-exists-callback.ast',
  'heuristics.ts.fs-write-file-callback.ast',
  'heuristics.ts.fs-append-file-callback.ast',
  'heuristics.ts.fs-readdir-callback.ast',
  'heuristics.ts.fs-mkdir-callback.ast',
  'heuristics.ts.fs-rmdir-callback.ast',
  'heuristics.ts.fs-rm-callback.ast',
  'heuristics.ts.fs-rename-callback.ast',
  'heuristics.ts.fs-copy-file-callback.ast',
  'heuristics.ts.fs-stat-callback.ast',
  'heuristics.ts.fs-statfs-callback.ast',
  'heuristics.ts.fs-lstat-callback.ast',
  'heuristics.ts.fs-realpath-callback.ast',
  'heuristics.ts.fs-access-callback.ast',
  'heuristics.ts.fs-chmod-callback.ast',
  'heuristics.ts.fs-chown-callback.ast',
  'heuristics.ts.fs-unlink-callback.ast',
  'heuristics.ts.fs-readlink-callback.ast',
  'heuristics.ts.fs-symlink-callback.ast',
  'heuristics.ts.fs-fsync-callback.ast',
  'heuristics.ts.fs-fdatasync-callback.ast',
  'heuristics.ts.fs-fchown-callback.ast',
  'heuristics.ts.fs-fchmod-callback.ast',
  'heuristics.ts.fs-fstat-callback.ast',
  'heuristics.ts.fs-ftruncate-callback.ast',
  'heuristics.ts.fs-truncate-callback.ast',
  'heuristics.ts.fs-futimes-callback.ast',
  'heuristics.ts.fs-lutimes-callback.ast',
  'heuristics.ts.fs-link-callback.ast',
  'heuristics.ts.fs-mkdtemp-callback.ast',
  'heuristics.ts.fs-opendir-callback.ast',
  'heuristics.ts.fs-open-callback.ast',
  'heuristics.ts.fs-cp-callback.ast',
  'heuristics.ts.fs-close-callback.ast',
  'heuristics.ts.fs-read-callback.ast',
  'heuristics.ts.fs-readv-callback.ast',
  'heuristics.ts.fs-writev-callback.ast',
  'heuristics.ts.fs-write-callback.ast',
  'heuristics.ts.child-process-exec-file.ast',
  'heuristics.ts.explicit-any.ast',
  'heuristics.ts.debugger.ast',
  'heuristics.ios.force-unwrap.ast',
  'heuristics.ios.anyview.ast',
  'heuristics.ios.force-try.ast',
  'heuristics.ios.force-cast.ast',
  'heuristics.ios.callback-style.ast',
  'heuristics.android.thread-sleep.ast',
  'heuristics.android.globalscope.ast',
  'heuristics.android.run-blocking.ast',
]);

const shouldPromoteHeuristicRule = (ruleId: string, stage: GateStage): boolean => {
  if (stage !== 'PRE_PUSH' && stage !== 'CI') {
    return false;
  }
  return promotedHeuristicRuleIds.has(ruleId);
};

export type ResolvedStagePolicy = {
  policy: GatePolicy;
  trace: {
    source: 'default' | 'skills.policy';
    bundle: string;
    hash: string;
  };
};

const defaultPolicyByStage: Record<SkillsStage, GatePolicy> = {
  PRE_COMMIT: {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  },
  PRE_PUSH: {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
  CI: {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
};

const createPolicyTraceHash = (params: {
  stage: SkillsStage;
  source: 'default' | 'skills.policy';
  blockOnOrAbove: GatePolicy['blockOnOrAbove'];
  warnOnOrAbove: GatePolicy['warnOnOrAbove'];
  sourcePolicyHash?: string;
}): string => {
  return createHash('sha256')
    .update(
      JSON.stringify({
        stage: params.stage,
        source: params.source,
        blockOnOrAbove: params.blockOnOrAbove,
        warnOnOrAbove: params.warnOnOrAbove,
        sourcePolicyHash: params.sourcePolicyHash ?? null,
      })
    )
    .digest('hex');
};

export const resolvePolicyForStage = (
  stage: SkillsStage,
  repoRoot: string = process.cwd()
): ResolvedStagePolicy => {
  const defaults = defaultPolicyByStage[stage];
  const loadedPolicy = loadSkillsPolicy(repoRoot);
  const stageOverride = loadedPolicy?.stages[stage];

  if (!stageOverride) {
    return {
      policy: defaults,
      trace: {
        source: 'default',
        bundle: `gate-policy.default.${stage}`,
        hash: createPolicyTraceHash({
          stage,
          source: 'default',
          blockOnOrAbove: defaults.blockOnOrAbove,
          warnOnOrAbove: defaults.warnOnOrAbove,
        }),
      },
    };
  }

  const resolvedPolicy: GatePolicy = {
    stage: defaults.stage,
    blockOnOrAbove: stageOverride.blockOnOrAbove,
    warnOnOrAbove: stageOverride.warnOnOrAbove,
  };

  return {
    policy: resolvedPolicy,
    trace: {
      source: 'skills.policy',
      bundle: `gate-policy.skills.policy.${stage}`,
      hash: createPolicyTraceHash({
        stage,
        source: 'skills.policy',
        blockOnOrAbove: resolvedPolicy.blockOnOrAbove,
        warnOnOrAbove: resolvedPolicy.warnOnOrAbove,
        sourcePolicyHash: createSkillsPolicyDeterministicHash(loadedPolicy),
      }),
    },
  };
};

export const applyHeuristicSeverityForStage = (
  rules: RuleSet,
  stage: GateStage
): RuleSet => {
  return rules.map((rule) => {
    if (!shouldPromoteHeuristicRule(rule.id, stage)) {
      return rule;
    }
    return {
      ...rule,
      severity: 'ERROR',
    };
  });
};

export const policyForPreCommit = (): GatePolicy => {
  return defaultPolicyByStage.PRE_COMMIT;
};

export const policyForPrePush = (): GatePolicy => {
  return defaultPolicyByStage.PRE_PUSH;
};

export const policyForCI = (): GatePolicy => {
  return defaultPolicyByStage.CI;
};
