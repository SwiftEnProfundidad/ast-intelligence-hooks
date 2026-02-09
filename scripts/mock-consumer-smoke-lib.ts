import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type SmokeMode = 'block' | 'minimal';

export type SmokeAssessment = {
  mode: SmokeMode;
  file: string;
  exists: boolean;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  preCommitExit?: number;
  prePushExit?: number;
  ciExit?: number;
  preCommitOutcome?: string;
  prePushOutcome?: string;
  ciOutcome?: string;
};

const parseExitLine = (
  markdown: string,
  label: 'pre-commit' | 'pre-push' | 'ci'
): { exit?: number; outcome?: string } => {
  const regex = new RegExp(`- ${label} exit:\\s*\\\`?(\\d+)\\\`?\\s*\\(([^)]+)\\)`, 'i');
  const match = markdown.match(regex);
  if (!match) {
    return {};
  }

  return {
    exit: Number.parseInt(match[1] ?? '', 10),
    outcome: (match[2] ?? '').trim().toUpperCase(),
  };
};

export const assessSmokeSummary = (
  mode: SmokeMode,
  pathLike: string,
  cwd: string = process.cwd()
): SmokeAssessment => {
  const absolute = resolve(cwd, pathLike);
  if (!existsSync(absolute)) {
    return {
      mode,
      file: pathLike,
      exists: false,
      status: 'UNKNOWN',
    };
  }

  const markdown = readFileSync(absolute, 'utf8');
  const statusRaw = markdown.match(/- Status:\s*([A-Z]+)/i)?.[1]?.trim().toUpperCase();
  const status =
    statusRaw === 'PASS' || statusRaw === 'FAIL'
      ? (statusRaw as 'PASS' | 'FAIL')
      : 'UNKNOWN';

  const preCommit = parseExitLine(markdown, 'pre-commit');
  const prePush = parseExitLine(markdown, 'pre-push');
  const ci = parseExitLine(markdown, 'ci');

  return {
    mode,
    file: pathLike,
    exists: true,
    status,
    preCommitExit: preCommit.exit,
    prePushExit: prePush.exit,
    ciExit: ci.exit,
    preCommitOutcome: preCommit.outcome,
    prePushOutcome: prePush.outcome,
    ciOutcome: ci.outcome,
  };
};

export const isExpectedModeResult = (assessment: SmokeAssessment): boolean => {
  if (!assessment.exists || assessment.status !== 'PASS') {
    return false;
  }

  if (assessment.mode === 'block') {
    return (
      assessment.preCommitExit === 1 &&
      assessment.prePushExit === 1 &&
      assessment.ciExit === 1 &&
      assessment.preCommitOutcome === 'BLOCK' &&
      assessment.prePushOutcome === 'BLOCK' &&
      assessment.ciOutcome === 'BLOCK'
    );
  }

  return (
    assessment.preCommitExit === 0 &&
    assessment.prePushExit === 0 &&
    assessment.ciExit === 0 &&
    assessment.preCommitOutcome === 'PASS' &&
    assessment.prePushOutcome === 'PASS' &&
    assessment.ciOutcome === 'PASS'
  );
};
