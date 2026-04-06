import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import { GitService } from './GitService';
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
import type { SnapshotEvaluationMetrics, SnapshotRulesCoverage } from '../evidence/schema';
import { normalizeSnapshotEvaluationMetrics } from '../evidence/evaluationMetrics';
import { normalizeSnapshotRulesCoverage } from '../evidence/rulesCoverage';
import type { TddBddSnapshot } from '../tdd/types';
import { emitGateTelemetryEvent } from '../telemetry/gateTelemetry';

const TRACKED_EVIDENCE_RELATIVE_PATH = '.ai_evidence.json';

const isTruthyEnvFlag = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const defaultIsEvidencePathTracked = (repoRoot: string, relativePath: string): boolean => {
  try {
    new GitService().runGit(['ls-files', '--error-unmatch', '--', relativePath], repoRoot);
    return true;
  } catch {
    return false;
  }
};

const shouldSkipPrePushTrackedEvidenceDiskWrite = (params: {
  stage: GateStage;
  gateOutcome: GateOutcome;
  repoRoot: string;
  isEvidencePathTracked: (repoRoot: string, relativePath: string) => boolean;
}): boolean => {
  if (isTruthyEnvFlag(process.env.PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE)) {
    return false;
  }
  return (
    params.stage === 'PRE_PUSH' &&
    params.gateOutcome !== 'BLOCK' &&
    params.isEvidencePathTracked(params.repoRoot, TRACKED_EVIDENCE_RELATIVE_PATH)
  );
};

export type PlatformGateEvidenceDependencies = {
  generateEvidence: typeof generateEvidence;
  emitGateTelemetryEvent: typeof emitGateTelemetryEvent;
  isEvidencePathTracked: (repoRoot: string, relativePath: string) => boolean;
};

const defaultDependencies: PlatformGateEvidenceDependencies = {
  generateEvidence,
  emitGateTelemetryEvent,
  isEvidencePathTracked: defaultIsEvidencePathTracked,
};

export const emitPlatformGateEvidence = (params: {
  stage: GateStage;
  auditMode?: 'gate' | 'engine';
  policyTrace?: ResolvedStagePolicy['trace'];
  findings: ReadonlyArray<Finding>;
  gateOutcome: GateOutcome;
  filesScanned: number;
  evaluationMetrics?: SnapshotEvaluationMetrics;
  rulesCoverage?: SnapshotRulesCoverage;
  tddBdd?: TddBddSnapshot;
  memoryShadow?: {
    recommended_outcome: GateOutcome;
    actual_outcome: GateOutcome;
    confidence: number;
    reason_codes: string[];
  };
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
  const evaluationMetrics = normalizeSnapshotEvaluationMetrics(params.evaluationMetrics);
  const rulesCoverage = normalizeSnapshotRulesCoverage(params.stage, params.rulesCoverage);
  const repoState = captureRepoState(params.repoRoot);
  const skipDiskWrite = shouldSkipPrePushTrackedEvidenceDiskWrite({
    stage: params.stage,
    gateOutcome: params.gateOutcome,
    repoRoot: params.repoRoot,
    isEvidencePathTracked: activeDependencies.isEvidencePathTracked,
  });

  activeDependencies.generateEvidence({
    stage: params.stage,
    auditMode: params.auditMode ?? 'gate',
    findings: params.findings,
    gateOutcome: params.gateOutcome,
    filesScanned: params.filesScanned,
    evaluationMetrics,
    rulesCoverage,
    ...(params.tddBdd ? { tddBdd: params.tddBdd } : {}),
    ...(params.memoryShadow ? { memoryShadow: params.memoryShadow } : {}),
    repoRoot: params.repoRoot,
    ...(skipDiskWrite ? { skipDiskWrite: true } : {}),
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
    repoState,
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

  void activeDependencies.emitGateTelemetryEvent({
    stage: params.stage,
    auditMode: params.auditMode ?? 'gate',
    gateOutcome: params.gateOutcome,
    filesScanned: params.filesScanned,
    findings: params.findings,
    repoRoot: params.repoRoot,
    repoState,
    policyTrace: params.policyTrace,
    sddDecision: params.sddDecision,
  });
};
