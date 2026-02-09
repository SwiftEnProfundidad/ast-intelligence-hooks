import type { AdapterParsedStatusReport } from './adapter-real-session-contract';

const parseCommandExitCode = (
  markdown: string,
  commandLabel: string
): number | undefined => {
  const escaped = commandLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\|\\s*${escaped}\\s*\\|[^|]*\\|\\s*([0-9]+)\\s*\\|`);
  const match = markdown.match(regex);
  if (!match?.[1]) {
    return undefined;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseAdapterRealSessionStatusReport = (
  markdown?: string
): AdapterParsedStatusReport => {
  if (!markdown) {
    return {
      strictAssessmentPass: false,
      anyAssessmentPass: false,
    };
  }

  const verdict = markdown.match(/- verdict:\s*([^\n]+)/)?.[1]?.trim();

  return {
    verdict,
    verifyExitCode: parseCommandExitCode(markdown, 'verify-adapter-hooks-runtime'),
    strictExitCode: parseCommandExitCode(markdown, 'assess-adapter-hooks-session'),
    anyExitCode: parseCommandExitCode(markdown, 'assess-adapter-hooks-session:any'),
    strictAssessmentPass: /assess-adapter-hooks-session[\s\S]*?session-assessment=PASS/.test(
      markdown
    ),
    anyAssessmentPass: /assess-adapter-hooks-session:any[\s\S]*?session-assessment=PASS/.test(
      markdown
    ),
  };
};
