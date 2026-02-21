import type { Fact } from '../core/facts/Fact';
import type { Severity } from '../core/rules/Severity';
import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { evaluatePlatformGateFindings } from '../integrations/git/runPlatformGateEvaluation';
import { resolveFactsForGateScope } from '../integrations/git/runPlatformGateFacts';
import { GitService } from '../integrations/git/GitService';

type RuleCoverageStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

type RuleCoverageStageDiagnostics = {
  stage: RuleCoverageStage;
  policyTraceBundle: string;
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
  evaluatedRuleIds: ReadonlyArray<string>;
  matchedRuleIds: ReadonlyArray<string>;
  unmatchedRuleIds: ReadonlyArray<string>;
};

export type RuleCoverageDiagnosticsReport = {
  repoRoot: string;
  generatedAt: string;
  stages: ReadonlyArray<RuleCoverageStageDiagnostics>;
};

type RuleCoverageDiagnosticsDependencies = {
  resolvePolicyForStage: typeof resolvePolicyForStage;
  resolveFactsForGateScope: typeof resolveFactsForGateScope;
  evaluatePlatformGateFindings: typeof evaluatePlatformGateFindings;
  createGitService: () => Pick<GitService, 'resolveRepoRoot'>;
};

const defaultDependencies: RuleCoverageDiagnosticsDependencies = {
  resolvePolicyForStage,
  resolveFactsForGateScope,
  evaluatePlatformGateFindings,
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

export const buildRuleCoverageDiagnostics = async (params?: {
  repoRoot?: string;
  stages?: ReadonlyArray<RuleCoverageStage>;
  dependencies?: Partial<RuleCoverageDiagnosticsDependencies>;
}): Promise<RuleCoverageDiagnosticsReport> => {
  const dependencies: RuleCoverageDiagnosticsDependencies = {
    ...defaultDependencies,
    ...params?.dependencies,
  };
  const stages = params?.stages ?? ['PRE_COMMIT', 'PRE_PUSH', 'CI'];
  const git = dependencies.createGitService();
  const repoRoot = params?.repoRoot ?? git.resolveRepoRoot();
  const diagnostics: RuleCoverageStageDiagnostics[] = [];

  for (const stage of stages) {
    const policy = dependencies.resolvePolicyForStage(stage, repoRoot);
    const facts = await dependencies.resolveFactsForGateScope({
      scope: { kind: 'repo' },
      git: git as never,
    });
    const evaluation = dependencies.evaluatePlatformGateFindings({
      facts: facts as ReadonlyArray<Fact>,
      stage,
      repoRoot,
    });

    diagnostics.push({
      stage,
      policyTraceBundle: policy.trace.bundle,
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
      findingsBySeverity: bySeverity(evaluation.findings),
      evaluatedRuleIds: evaluation.coverage.evaluatedRuleIds,
      matchedRuleIds: evaluation.coverage.matchedRuleIds,
      unmatchedRuleIds: evaluation.coverage.unmatchedRuleIds,
    });
  }

  return {
    repoRoot,
    generatedAt: new Date().toISOString(),
    stages: diagnostics,
  };
};

export const formatRuleCoverageDiagnostics = (
  report: RuleCoverageDiagnosticsReport
): string => {
  const lines: string[] = [
    'RULE COVERAGE DIAGNOSTICS',
    `repo_root=${report.repoRoot}`,
    `generated_at=${report.generatedAt}`,
    '',
  ];

  for (const stage of report.stages) {
    lines.push(`[${stage.stage}] policy=${stage.policyTraceBundle}`);
    lines.push(
      `facts_total=${stage.factsTotal} files_scanned=${stage.filesScanned} rules_total=${stage.rulesTotal}`
    );
    lines.push(
      `rules_baseline=${stage.baselineRules} rules_heuristics=${stage.heuristicRules} rules_skills=${stage.skillsRules} rules_project=${stage.projectRules}`
    );
    lines.push(
      `matched_rules=${stage.matchedRules} unmatched_rules=${stage.unmatchedRules} findings_total=${stage.findingsTotal}`
    );
    lines.push(
      `findings_by_severity=CRITICAL:${stage.findingsBySeverity.CRITICAL}|ERROR:${stage.findingsBySeverity.ERROR}|WARN:${stage.findingsBySeverity.WARN}|INFO:${stage.findingsBySeverity.INFO}`
    );
    lines.push(
      `evaluated_rule_ids=${stage.evaluatedRuleIds.length > 0 ? stage.evaluatedRuleIds.join(',') : 'none'}`
    );
    lines.push(
      `matched_rule_ids=${stage.matchedRuleIds.length > 0 ? stage.matchedRuleIds.join(',') : 'none'}`
    );
    lines.push(
      `unmatched_rule_ids=${stage.unmatchedRuleIds.length > 0 ? stage.unmatchedRuleIds.join(',') : 'none'}`
    );
    lines.push('');
  }

  return lines.join('\n').trimEnd();
};

export default {
  buildRuleCoverageDiagnostics,
  formatRuleCoverageDiagnostics,
};
