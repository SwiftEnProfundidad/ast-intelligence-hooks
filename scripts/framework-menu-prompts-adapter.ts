import type { Questioner } from './framework-menu-prompt-types';

export const createAdapterPrompts = (rl: Questioner) => {
  const askAdapterSessionStatusReport = async (): Promise<{ outFile: string }> => {
    const outPrompt = await rl.question(
      'output path [.audit-reports/adapter/adapter-session-status.md]: '
    );

    return {
      outFile: outPrompt.trim() || '.audit-reports/adapter/adapter-session-status.md',
    };
  };

  const askAdapterRealSessionReport = async (): Promise<{
    statusReportFile: string;
    outFile: string;
  }> => {
    const statusPrompt = await rl.question(
      'status report path [.audit-reports/adapter/adapter-session-status.md]: '
    );
    const outPrompt = await rl.question(
      'output path [.audit-reports/adapter/adapter-real-session-report.md]: '
    );

    return {
      statusReportFile:
        statusPrompt.trim() || '.audit-reports/adapter/adapter-session-status.md',
      outFile: outPrompt.trim() || '.audit-reports/adapter/adapter-real-session-report.md',
    };
  };

  const askAdapterReadiness = async (): Promise<{ adapterReportFile: string; outFile: string }> => {
    const adapterPrompt = await rl.question(
      'adapter report path [.audit-reports/adapter/adapter-real-session-report.md]: '
    );
    const outPrompt = await rl.question('output path [.audit-reports/adapter/adapter-readiness.md]: ');

    return {
      adapterReportFile:
        adapterPrompt.trim() || '.audit-reports/adapter/adapter-real-session-report.md',
      outFile: outPrompt.trim() || '.audit-reports/adapter/adapter-readiness.md',
    };
  };

  return {
    askAdapterSessionStatusReport,
    askAdapterRealSessionReport,
    askAdapterReadiness,
  };
};
