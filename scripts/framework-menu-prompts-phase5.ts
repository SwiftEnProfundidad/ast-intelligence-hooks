import {
  parseInteger,
  parsePositive,
  type Questioner,
} from './framework-menu-prompt-types';
import { DEFAULT_ACTIONLINT_BIN, DEFAULT_CONSUMER_REPO_PATH } from './framework-menu-runners';

export const createPhase5Prompts = (rl: Questioner) => {
  const askPhase5BlockersReadiness = async (): Promise<{
    adapterReportFile: string;
    consumerTriageReportFile: string;
    outFile: string;
  }> => {
    const adapterPrompt = await rl.question(
      'adapter report path [.audit-reports/adapter/adapter-real-session-report.md]: '
    );
    const consumerPrompt = await rl.question(
      'consumer triage report path [.audit-reports/consumer-triage/consumer-startup-triage-report.md]: '
    );
    const outPrompt = await rl.question(
      'output path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
    );

    return {
      adapterReportFile:
        adapterPrompt.trim() || '.audit-reports/adapter/adapter-real-session-report.md',
      consumerTriageReportFile:
        consumerPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
      outFile: outPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
    };
  };

  const askMockConsumerAbReport = async (): Promise<{
    repo: string;
    outFile: string;
    blockSummaryFile: string;
    minimalSummaryFile: string;
    blockEvidenceFile: string;
    minimalEvidenceFile: string;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const outPrompt = await rl.question(
      'output path [.audit-reports/mock-consumer/mock-consumer-ab-report.md]: '
    );
    const blockPrompt = await rl.question(
      'block summary path [.audit-reports/package-smoke/block/summary.md]: '
    );
    const minimalPrompt = await rl.question(
      'minimal summary path [.audit-reports/package-smoke/minimal/summary.md]: '
    );
    const blockEvidencePrompt = await rl.question(
      'block CI evidence path [.audit-reports/package-smoke/block/ci.ai_evidence.json]: '
    );
    const minimalEvidencePrompt = await rl.question(
      'minimal CI evidence path [.audit-reports/package-smoke/minimal/ci.ai_evidence.json]: '
    );

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      outFile: outPrompt.trim() || '.audit-reports/mock-consumer/mock-consumer-ab-report.md',
      blockSummaryFile: blockPrompt.trim() || '.audit-reports/package-smoke/block/summary.md',
      minimalSummaryFile:
        minimalPrompt.trim() || '.audit-reports/package-smoke/minimal/summary.md',
      blockEvidenceFile:
        blockEvidencePrompt.trim() || '.audit-reports/package-smoke/block/ci.ai_evidence.json',
      minimalEvidenceFile:
        minimalEvidencePrompt.trim() ||
        '.audit-reports/package-smoke/minimal/ci.ai_evidence.json',
    };
  };

  const askPhase5ExecutionClosureStatus = async (): Promise<{
    phase5BlockersReportFile: string;
    consumerUnblockReportFile: string;
    adapterReadinessReportFile: string;
    outFile: string;
    requireAdapterReadiness: boolean;
  }> => {
    const blockersPrompt = await rl.question(
      'phase5 blockers report path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
    );
    const consumerPrompt = await rl.question(
      'consumer unblock report path [.audit-reports/consumer-triage/consumer-startup-unblock-status.md]: '
    );
    const adapterPrompt = await rl.question(
      'adapter readiness report path [.audit-reports/adapter/adapter-readiness.md]: '
    );
    const requireAdapterPrompt = await rl.question('require adapter readiness verdict READY? [no]: ');
    const outPrompt = await rl.question(
      'output path [.audit-reports/phase5/phase5-execution-closure-status.md]: '
    );

    return {
      phase5BlockersReportFile:
        blockersPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
      consumerUnblockReportFile:
        consumerPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
      adapterReadinessReportFile:
        adapterPrompt.trim() || '.audit-reports/adapter/adapter-readiness.md',
      outFile: outPrompt.trim() || '.audit-reports/phase5/phase5-execution-closure-status.md',
      requireAdapterReadiness: parsePositive(requireAdapterPrompt),
    };
  };

  const askPhase5ExternalHandoff = async (): Promise<{
    repo: string;
    phase5StatusReportFile: string;
    phase5BlockersReportFile: string;
    consumerUnblockReportFile: string;
    mockAbReportFile: string;
    runReportFile: string;
    outFile: string;
    artifactUrls: string[];
    requireArtifactUrls: boolean;
    requireMockAbReport: boolean;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const statusPrompt = await rl.question(
      'phase5 status report path [.audit-reports/phase5/phase5-execution-closure-status.md]: '
    );
    const blockersPrompt = await rl.question(
      'phase5 blockers report path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
    );
    const consumerPrompt = await rl.question(
      'consumer unblock report path [.audit-reports/phase5/consumer-startup-unblock-status.md]: '
    );
    const mockAbPrompt = await rl.question(
      'mock A/B report path [.audit-reports/phase5/mock-consumer-ab-report.md]: '
    );
    const runReportPrompt = await rl.question(
      'phase5 run report path [.audit-reports/phase5/phase5-execution-closure-run-report.md]: '
    );
    const outPrompt = await rl.question(
      'output path [.audit-reports/phase5/phase5-external-handoff.md]: '
    );
    const artifactUrlsPrompt = await rl.question('artifact URLs (comma-separated) [none]: ');
    const requireArtifactPrompt = await rl.question('require artifact URLs? [no]: ');
    const requireMockAbPrompt = await rl.question('require mock A/B report READY? [no]: ');

    const artifactUrls = artifactUrlsPrompt
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      phase5StatusReportFile:
        statusPrompt.trim() || '.audit-reports/phase5/phase5-execution-closure-status.md',
      phase5BlockersReportFile:
        blockersPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
      consumerUnblockReportFile:
        consumerPrompt.trim() || '.audit-reports/phase5/consumer-startup-unblock-status.md',
      mockAbReportFile:
        mockAbPrompt.trim() || '.audit-reports/phase5/mock-consumer-ab-report.md',
      runReportFile:
        runReportPrompt.trim() || '.audit-reports/phase5/phase5-execution-closure-run-report.md',
      outFile: outPrompt.trim() || '.audit-reports/phase5/phase5-external-handoff.md',
      artifactUrls,
      requireArtifactUrls: parsePositive(requireArtifactPrompt),
      requireMockAbReport: parsePositive(requireMockAbPrompt),
    };
  };

  const askPhase5ExecutionClosure = async (): Promise<{
    repo: string;
    limit: number;
    outDir: string;
    runWorkflowLint: boolean;
    includeAuthPreflight: boolean;
    repoPath?: string;
    actionlintBin?: string;
    includeAdapter: boolean;
    requireAdapterReadiness: boolean;
    useMockConsumerTriage: boolean;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const limitPrompt = await rl.question('runs to inspect [20]: ');
    const outDirPrompt = await rl.question('output directory [.audit-reports/phase5]: ');
    const mockConsumerPrompt = await rl.question('use local mock-consumer package-smoke mode? [no]: ');

    const useMockConsumerTriage = parsePositive(mockConsumerPrompt);

    if (useMockConsumerTriage) {
      const includeAdapterPrompt = await rl.question('include adapter diagnostics? [no]: ');
      const includeAdapter = parsePositive(includeAdapterPrompt);
      const requireAdapterPrompt = await rl.question('require adapter readiness verdict READY? [no]: ');

      return {
        repo: repoPrompt.trim() || 'owner/repo',
        limit: parseInteger(limitPrompt, 20),
        outDir: outDirPrompt.trim() || '.audit-reports/phase5',
        runWorkflowLint: false,
        includeAuthPreflight: false,
        includeAdapter,
        requireAdapterReadiness: includeAdapter && parsePositive(requireAdapterPrompt),
        useMockConsumerTriage: true,
      };
    }

    const workflowLintPrompt = await rl.question('include workflow lint? [yes]: ');
    const authPreflightPrompt = await rl.question(
      'run auth preflight and fail-fast on auth block? [yes]: '
    );
    const includeAdapterPrompt = await rl.question('include adapter diagnostics? [yes]: ');
    const requireAdapterPrompt = await rl.question('require adapter readiness verdict READY? [no]: ');

    const runWorkflowLint = !workflowLintPrompt.trim() ? true : parsePositive(workflowLintPrompt);
    const includeAuthPreflight = !authPreflightPrompt.trim() ? true : parsePositive(authPreflightPrompt);
    const includeAdapter = !includeAdapterPrompt.trim() ? true : parsePositive(includeAdapterPrompt);
    const requireAdapterReadiness = includeAdapter && parsePositive(requireAdapterPrompt);

    let repoPath: string | undefined;
    let actionlintBin: string | undefined;

    if (runWorkflowLint) {
      const repoPathPrompt = await rl.question(
        `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
      );
      const actionlintBinPrompt = await rl.question(
        `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
      );

      repoPath = repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH;
      actionlintBin = actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN;
    }

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      limit: parseInteger(limitPrompt, 20),
      outDir: outDirPrompt.trim() || '.audit-reports/phase5',
      runWorkflowLint,
      includeAuthPreflight,
      repoPath,
      actionlintBin,
      includeAdapter,
      requireAdapterReadiness,
      useMockConsumerTriage: false,
    };
  };

  return {
    askPhase5BlockersReadiness,
    askMockConsumerAbReport,
    askPhase5ExecutionClosureStatus,
    askPhase5ExternalHandoff,
    askPhase5ExecutionClosure,
  };
};
