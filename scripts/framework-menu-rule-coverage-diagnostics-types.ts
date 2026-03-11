import type { GateStage } from '../core/gate/GateStage';
import type { Severity } from '../core/rules/Severity';
import type { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import type { evaluatePlatformGateFindings as evaluatePlatformGateFindingsBase } from '../integrations/git/runPlatformGateEvaluation';
import type { resolveFactsForGateScope } from '../integrations/git/runPlatformGateFacts';
import type { GitService } from '../integrations/git/GitService';
import type { evaluateSddPolicy } from '../integrations/sdd/policy';
import type { SddDecisionCode } from '../integrations/sdd/types';

export type RuleCoverageStage = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type RuleCoverageStageDiagnostics = {
  stage: RuleCoverageStage;
  policyTraceBundle: string;
  evaluationStage: GateStage;
  factsTotal: number;
  filesScanned: number;
  rulesTotal: number;
  baselineRules: number;
  heuristicRules: number;
  skillsRules: number;
  projectRules: number;
  matchedRules: number;
  unmatchedRules: number;
  findingsTotal: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByEnterpriseSeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  evaluatedRuleIds: ReadonlyArray<string>;
  matchedRuleIds: ReadonlyArray<string>;
  unmatchedRuleIds: ReadonlyArray<string>;
  sdd: {
    allowed: boolean;
    code: SddDecisionCode;
  };
};

export type RuleCoverageDiagnosticsReport = {
  repoRoot: string;
  generatedAt: string;
  stages: ReadonlyArray<RuleCoverageStageDiagnostics>;
};

export type RuleCoverageDiagnosticsDependencies = {
  resolvePolicyForStage: typeof resolvePolicyForStage;
  resolveFactsForGateScope: typeof resolveFactsForGateScope;
  evaluatePlatformGateFindings: typeof evaluatePlatformGateFindingsBase;
  evaluateSddPolicy: typeof evaluateSddPolicy;
  createGitService: () => Pick<GitService, 'resolveRepoRoot'>;
};
