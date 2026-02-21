import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import { rulePackVersions } from '../../core/rules/presets/rulePackVersions';
import type { RuleSet } from '../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../config/skillsRuleSet';
import { generateEvidence } from '../evidence/generateEvidence';
import type { ResolvedStagePolicy } from '../gate/stagePolicies';
import type { DetectedPlatforms } from '../platform/detectPlatforms';
import { buildBaselineRuleSetEntries } from './baselineRuleSets';
import type { IEvidenceService } from './EvidenceService';
import type { SddDecision } from '../sdd';
import { captureRepoState } from '../evidence/repoState';

export type PlatformGateEvidenceDependencies = {
  generateEvidence: typeof generateEvidence;
};

const defaultDependencies: PlatformGateEvidenceDependencies = {
  generateEvidence,
};

export const emitPlatformGateEvidence = (params: {
  stage: GateStage;
  policyTrace?: ResolvedStagePolicy['trace'];
  findings: ReadonlyArray<Finding>;
  gateOutcome: GateOutcome;
  filesScanned: number;
  repoRoot: string;
  detectedPlatforms: DetectedPlatforms;
  skillsRuleSet: SkillsRuleSetLoadResult;
  projectRules: RuleSet;
  heuristicRules: RuleSet;
  evidenceService: IEvidenceService;
  sddDecision?: Pick<SddDecision, 'allowed' | 'code' | 'message'>;
}, dependencies: Partial<PlatformGateEvidenceDependencies> = {}): void => {
  const activeDependencies: PlatformGateEvidenceDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  activeDependencies.generateEvidence({
    stage: params.stage,
    findings: params.findings,
    gateOutcome: params.gateOutcome,
    filesScanned: params.filesScanned,
    repoRoot: params.repoRoot,
    previousEvidence: params.evidenceService.loadPreviousEvidence(params.repoRoot),
    detectedPlatforms: params.evidenceService.toDetectedPlatformsRecord(params.detectedPlatforms),
    loadedRulesets: params.evidenceService.buildRulesetState({
      baselineRuleSets: buildBaselineRuleSetEntries(params.detectedPlatforms),
      projectRules: params.projectRules,
      heuristicRules: params.heuristicRules,
      heuristicsBundle: `astHeuristicsRuleSet@${rulePackVersions.astHeuristicsRuleSet}`,
      skillsBundles: params.skillsRuleSet.activeBundles,
      policyTrace: params.policyTrace,
      stage: params.stage,
    }),
    repoState: captureRepoState(params.repoRoot),
    sddMetrics: params.sddDecision
      ? {
        enforced: true,
        stage: params.stage,
        decision: {
          allowed: params.sddDecision.allowed,
          code: params.sddDecision.code,
          message: params.sddDecision.message,
        },
      }
      : undefined,
  });
};
