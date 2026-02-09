import {
  DEFAULT_ACTIONLINT_BIN,
  DEFAULT_CONSUMER_REPO_PATH,
} from './framework-menu-runners';
import {
  parseInteger,
  parsePositive,
  type Questioner,
} from './framework-menu-prompt-types';

export const createConsumerPrompts = (rl: Questioner) => {
  const askConsumerCiScan = async (): Promise<{
    repo: string;
    limit: number;
    outFile: string;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const limitPrompt = await rl.question('runs to inspect [20]: ');
    const outPrompt = await rl.question(
      'output path [.audit-reports/consumer-triage/consumer-ci-artifacts-report.md]: '
    );

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      limit: parseInteger(limitPrompt, 20),
      outFile:
        outPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-artifacts-report.md',
    };
  };

  const askConsumerWorkflowLint = async (): Promise<{
    repoPath: string;
    actionlintBin: string;
    outFile: string;
  }> => {
    const repoPathPrompt = await rl.question(
      `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
    );
    const actionlintBinPrompt = await rl.question(
      `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
    );
    const outPrompt = await rl.question(
      'output path [.audit-reports/consumer-triage/consumer-workflow-lint-report.md]: '
    );

    return {
      repoPath: repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH,
      actionlintBin: actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN,
      outFile:
        outPrompt.trim() || '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
    };
  };

  const askConsumerCiAuthCheck = async (): Promise<{ repo: string; outFile: string }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const outPrompt = await rl.question(
      'output path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
    );

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
    };
  };

  const askConsumerSupportBundle = async (): Promise<{
    repo: string;
    limit: number;
    outFile: string;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const limitPrompt = await rl.question('runs to inspect [20]: ');
    const outPrompt = await rl.question(
      'output path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
    );

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      limit: parseInteger(limitPrompt, 20),
      outFile:
        outPrompt.trim() ||
        '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
    };
  };

  const askConsumerSupportTicketDraft = async (): Promise<{
    repo: string;
    supportBundleFile: string;
    authReportFile: string;
    outFile: string;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const supportBundlePrompt = await rl.question(
      'support bundle path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
    );
    const authReportPrompt = await rl.question(
      'auth report path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
    );
    const outPrompt = await rl.question(
      'output path [.audit-reports/consumer-triage/consumer-support-ticket-draft.md]: '
    );

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      supportBundleFile:
        supportBundlePrompt.trim() ||
        '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
      authReportFile:
        authReportPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
      outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-support-ticket-draft.md',
    };
  };

  const askConsumerStartupUnblockStatus = async (): Promise<{
    repo: string;
    supportBundleFile: string;
    authReportFile: string;
    workflowLintReportFile: string;
    outFile: string;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const supportBundlePrompt = await rl.question(
      'support bundle path [.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md]: '
    );
    const authReportPrompt = await rl.question(
      'auth report path [.audit-reports/consumer-triage/consumer-ci-auth-check.md]: '
    );
    const workflowLintPrompt = await rl.question(
      'workflow lint report path [.audit-reports/consumer-triage/consumer-workflow-lint-report.md]: '
    );
    const outPrompt = await rl.question(
      'output path [.audit-reports/consumer-triage/consumer-startup-unblock-status.md]: '
    );

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      supportBundleFile:
        supportBundlePrompt.trim() ||
        '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
      authReportFile:
        authReportPrompt.trim() || '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
      workflowLintReportFile:
        workflowLintPrompt.trim() ||
        '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
      outFile: outPrompt.trim() || '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    };
  };

  const askConsumerStartupTriage = async (): Promise<{
    repo: string;
    limit: number;
    outDir: string;
    runWorkflowLint: boolean;
    repoPath?: string;
    actionlintBin?: string;
  }> => {
    const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
    const limitPrompt = await rl.question('runs to inspect [20]: ');
    const outDirPrompt = await rl.question('output directory [.audit-reports/consumer-triage]: ');
    const workflowLintPrompt = await rl.question('include workflow lint? [no]: ');

    const runWorkflowLint = parsePositive(workflowLintPrompt);

    if (!runWorkflowLint) {
      return {
        repo: repoPrompt.trim() || 'owner/repo',
        limit: parseInteger(limitPrompt, 20),
        outDir: outDirPrompt.trim() || '.audit-reports/consumer-triage',
        runWorkflowLint: false,
      };
    }

    const repoPathPrompt = await rl.question(
      `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
    );
    const actionlintBinPrompt = await rl.question(
      `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
    );

    return {
      repo: repoPrompt.trim() || 'owner/repo',
      limit: parseInteger(limitPrompt, 20),
      outDir: outDirPrompt.trim() || '.audit-reports/consumer-triage',
      runWorkflowLint: true,
      repoPath: repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH,
      actionlintBin: actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN,
    };
  };

  return {
    askConsumerCiScan,
    askConsumerWorkflowLint,
    askConsumerCiAuthCheck,
    askConsumerSupportBundle,
    askConsumerSupportTicketDraft,
    askConsumerStartupUnblockStatus,
    askConsumerStartupTriage,
  };
};
