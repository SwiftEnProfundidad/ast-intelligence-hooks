import type { Fact } from '../core/facts/Fact';
import type { GateStage } from '../core/gate/GateStage';
import type { Severity } from '../core/rules/Severity';
import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { evaluatePlatformGateFindings as evaluatePlatformGateFindingsBase } from '../integrations/git/runPlatformGateEvaluation';
import { resolveFactsForGateScope } from '../integrations/git/runPlatformGateFacts';
import { GitService } from '../integrations/git/GitService';
import { evaluateSddPolicy } from '../integrations/sdd/policy';
import type {
  RuleCoverageDiagnosticsDependencies,
  RuleCoverageDiagnosticsReport,
  RuleCoverageStage,
  RuleCoverageStageDiagnostics,
} from './framework-menu-rule-coverage-diagnostics-types';

const defaultDependencies: RuleCoverageDiagnosticsDependencies = {
  resolvePolicyForStage,
  resolveFactsForGateScope,
  evaluatePlatformGateFindings: (params) =>
    evaluatePlatformGateFindingsBase(params, {
      loadHeuristicsConfig: () => ({
        astSemanticEnabled: true,
        typeScriptScope: 'all',
      }),
    }),
  evaluateSddPolicy,
  createGitService: () => new GitService(),
};

const emptySeverity = (): Record<Severity, number> => ({
  CRITICAL: 0,
  ERROR: 0,
  WARN: 0,
  INFO: 0,
});

const bySeverity = (findings: ReadonlyArray<{ severity: Severity }>): Record<Severity, number> => {
  const output = emptySeverity();
  for (const finding of findings) {
    output[finding.severity] += 1;
  }
  return output;
};

const toEnterpriseBySeverity = (
  severity: Readonly<Record<Severity, number>>
): RuleCoverageStageDiagnostics['findingsByEnterpriseSeverity'] => {
  return {
    CRITICAL: severity.CRITICAL,
    HIGH: severity.ERROR,
    MEDIUM: severity.WARN,
    LOW: severity.INFO,
  };
};

export const buildRuleCoverageDiagnostics = async (params?: {
  repoRoot?: string;
  stages?: ReadonlyArray<RuleCoverageStage>;
  dependencies?: Partial<RuleCoverageDiagnosticsDependencies>;
}): Promise<RuleCoverageDiagnosticsReport> => {
  const dependencies: RuleCoverageDiagnosticsDependencies = {
    ...defaultDependencies,
    ...params?.dependencies,
  };
  const stages = params?.stages ?? ['PRE_WRITE', 'PRE_COMMIT', 'PRE_PUSH', 'CI'];
  const git = dependencies.createGitService();
  const repoRoot = params?.repoRoot ?? git.resolveRepoRoot();
  const diagnostics: RuleCoverageStageDiagnostics[] = [];

  for (const stage of stages) {
    const evaluationStage: GateStage = stage === 'PRE_WRITE' ? 'PRE_COMMIT' : stage;
    const policy = dependencies.resolvePolicyForStage(evaluationStage, repoRoot);
    const sdd = dependencies.evaluateSddPolicy({
      stage,
      repoRoot,
    }).decision;
    const facts = await dependencies.resolveFactsForGateScope({
      scope: { kind: 'repo' },
      git: git as never,
    });
    const evaluation = dependencies.evaluatePlatformGateFindings({
      facts: facts as ReadonlyArray<Fact>,
      stage: evaluationStage,
      repoRoot,
    });
    const findingsBySeverity = bySeverity(evaluation.findings);

    diagnostics.push({
      stage,
      policyTraceBundle:
        stage === 'PRE_WRITE'
          ? `gate-policy.synthetic.PRE_WRITE->${policy.trace.bundle}`
          : policy.trace.bundle,
      evaluationStage,
      factsTotal: evaluation.coverage.factsTotal,
      filesScanned: evaluation.coverage.filesScanned,
      rulesTotal: evaluation.coverage.rulesTotal,
      baselineRules: evaluation.coverage.baselineRules,
      heuristicRules: evaluation.coverage.heuristicRules,
      skillsRules: evaluation.coverage.skillsRules,
      projectRules: evaluation.coverage.projectRules,
      matchedRules: evaluation.coverage.matchedRules,
      unmatchedRules: evaluation.coverage.unmatchedRules,
      findingsTotal: evaluation.findings.length,
      findingsBySeverity,
      findingsByEnterpriseSeverity: toEnterpriseBySeverity(findingsBySeverity),
      evaluatedRuleIds: evaluation.coverage.evaluatedRuleIds,
      matchedRuleIds: evaluation.coverage.matchedRuleIds,
      unmatchedRuleIds: evaluation.coverage.unmatchedRuleIds,
      sdd: {
        allowed: sdd.allowed,
        code: sdd.code,
      },
    });
  }

  return {
    repoRoot,
    generatedAt: new Date().toISOString(),
    stages: diagnostics,
  };
};
