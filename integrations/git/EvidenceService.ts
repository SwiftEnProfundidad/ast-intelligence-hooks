import { createHash } from 'node:crypto';
import type { RuleSet } from '../../core/rules/RuleSet';
import { stableStringify } from '../../core/utils/stableStringify';
import { readEvidence } from '../evidence/readEvidence';
import type { AiEvidenceV2_1, PlatformState, RulesetState } from '../evidence/schema';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { ResolvedStagePolicy } from '../gate/stagePolicies';
import { detectPlatformsFromFacts } from '../platform/detectPlatforms';

export type BaselineRuleSetEntry = {
  platform: string;
  bundle: string;
  rules: RuleSet;
};


export interface IEvidenceService {
  loadPreviousEvidence(repoRoot: string): AiEvidenceV2_1 | undefined;
  toDetectedPlatformsRecord(
    detected: ReturnType<typeof detectPlatformsFromFacts>
  ): Record<string, PlatformState>;
  buildRulesetState(params: {
    baselineRuleSets: ReadonlyArray<BaselineRuleSetEntry>;
    projectRules: RuleSet;
    heuristicRules: RuleSet;
    heuristicsBundle: string;
    skillsBundles: ReadonlyArray<{ name: string; version: string; hash: string }>;
    policyTrace?: ResolvedStagePolicy['trace'];
    stage: GatePolicy['stage'];
  }): RulesetState[];
}

export class EvidenceService implements IEvidenceService {
  loadPreviousEvidence(repoRoot: string): AiEvidenceV2_1 | undefined {
    return readEvidence(repoRoot);
  }

  toDetectedPlatformsRecord(
    detected: ReturnType<typeof detectPlatformsFromFacts>
  ): Record<string, PlatformState> {
    const result: Record<string, PlatformState> = {};
    for (const [platform, state] of Object.entries(detected)) {
      if (!state) {
        continue;
      }
      result[platform] = state;
    }
    return result;
  }

  buildRulesetState(params: {
    baselineRuleSets: ReadonlyArray<BaselineRuleSetEntry>;
    projectRules: RuleSet;
    heuristicRules: RuleSet;
    heuristicsBundle: string;
    skillsBundles: ReadonlyArray<{ name: string; version: string; hash: string }>;
    policyTrace?: ResolvedStagePolicy['trace'];
    stage: GatePolicy['stage'];
  }): RulesetState[] {
    const states: RulesetState[] = [];

    for (const entry of params.baselineRuleSets) {
      states.push({
        platform: entry.platform,
        bundle: entry.bundle,
        hash: createHash('sha256')
          .update(stableStringify(entry.rules))
          .digest('hex'),
      });
    }

    if (params.projectRules.length > 0) {
      states.push({
        platform: 'project',
        bundle: 'project-rules',
        hash: createHash('sha256')
          .update(stableStringify(params.projectRules))
          .digest('hex'),
      });
    }

    if (params.heuristicRules.length > 0) {
      states.push({
        platform: 'heuristics',
        bundle: params.heuristicsBundle,
        hash: createHash('sha256')
          .update(`stage:${params.stage}`)
          .update(stableStringify(params.heuristicRules))
          .digest('hex'),
      });
    }

    for (const bundle of params.skillsBundles) {
      states.push({
        platform: 'skills',
        bundle: `${bundle.name}@${bundle.version}`,
        hash: bundle.hash,
      });
    }

    if (params.policyTrace) {
      states.push({
        platform: 'policy',
        bundle: params.policyTrace.bundle,
        hash: params.policyTrace.hash,
        ...(params.policyTrace.version ? { version: params.policyTrace.version } : {}),
        ...(params.policyTrace.signature ? { signature: params.policyTrace.signature } : {}),
        ...(params.policyTrace.policySource ? { source: params.policyTrace.policySource } : {}),
        ...(params.policyTrace.validation
          ? {
              validation_status: params.policyTrace.validation.status,
              validation_code: params.policyTrace.validation.code,
            }
          : {}),
        ...(params.policyTrace.degraded
          ? {
              degraded_mode_enabled: params.policyTrace.degraded.enabled,
              degraded_mode_action: params.policyTrace.degraded.action,
              degraded_mode_reason: params.policyTrace.degraded.reason,
              degraded_mode_source: params.policyTrace.degraded.source,
              degraded_mode_code: params.policyTrace.degraded.code,
            }
          : {}),
      });
    }

    return states;
  }
}
