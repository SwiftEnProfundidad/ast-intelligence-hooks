import path from 'node:path';

import { normalizeNotificationText } from './framework-menu-system-notifications-text';

type LegacySkillCause = {
  readonly ruleId: string;
  readonly file?: string;
  readonly line?: string;
  readonly message?: string;
  readonly remediation?: string;
};

const FIELD_NAMES = ['severity', 'file', 'line', 'lines', 'message', 'remediation'] as const;

const RULE_LABELS: Readonly<Record<string, string>> = {
  'skills.ios.prefer-swift-testing': 'Swift Testing',
  'skills.ios.no-wait-for-expectations': 'Swift Testing async',
  'skills.ios.no-xctassert': 'Swift Testing',
  'skills.ios.no-xctunwrap': 'Swift Testing',
  'skills.backend.no-empty-catch': 'Backend: no empty catch',
};

const extractLegacySkillSegment = (message?: string): string | null => {
  if (!message) {
    return null;
  }
  const markerIndex = message.indexOf('Blocking causes:');
  if (markerIndex < 0) {
    return null;
  }
  const afterMarker = message.slice(markerIndex);
  const firstCause = afterMarker.replace(/^Blocking causes:\s*1\)\s*/i, '');
  const nextCauseIndex = firstCause.search(/\s+\d+\)\s+skills\./);
  return nextCauseIndex >= 0 ? firstCause.slice(0, nextCauseIndex) : firstCause;
};

const extractField = (segment: string, fieldName: string): string | undefined => {
  const nextFields = FIELD_NAMES.filter((name) => name !== fieldName).join('|');
  const pattern = new RegExp(`(?:^|\\s)${fieldName}=([\\s\\S]*?)(?=\\s(?:${nextFields})=|$)`);
  const match = segment.match(pattern);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : undefined;
};

const humanizeRuleId = (ruleId: string): string =>
  RULE_LABELS[ruleId] ??
  ruleId
    .replace(/^skills\./, '')
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatLocation = (cause: LegacySkillCause): string | null => {
  if (!cause.file) {
    return null;
  }
  const basename = path.basename(cause.file);
  return cause.line ? `${basename}:${cause.line}` : basename;
};

export const extractLegacySkillCauseFromMessage = (
  message?: string
): LegacySkillCause | null => {
  const segment = extractLegacySkillSegment(message);
  if (!segment) {
    return null;
  }
  const ruleId = segment.match(/\bskills\.[a-z0-9_.-]+\b/i)?.[0];
  if (!ruleId) {
    return null;
  }
  return {
    ruleId,
    file: extractField(segment, 'file'),
    line: extractField(segment, 'lines') ?? extractField(segment, 'line'),
    message: extractField(segment, 'message'),
    remediation: extractField(segment, 'remediation'),
  };
};

export const buildLegacySkillCauseSummary = (message?: string): string | null => {
  const cause = extractLegacySkillCauseFromMessage(message);
  if (!cause) {
    return null;
  }
  const rule = humanizeRuleId(cause.ruleId);
  const location = formatLocation(cause);
  return location ? `Skill violada: ${location} · ${rule}` : `Skill violada: ${rule}`;
};

export const buildLegacySkillCauseRemediation = (message?: string): string | null => {
  const cause = extractLegacySkillCauseFromMessage(message);
  if (!cause) {
    return null;
  }
  const rule = humanizeRuleId(cause.ruleId);
  const location = formatLocation(cause);
  const failure = cause.message
    ? ` Falla: ${normalizeNotificationText(cause.message)}.`
    : '';
  const remediation = cause.remediation
    ? normalizeNotificationText(cause.remediation)
    : 'Corrige esa regla en el fichero afectado y vuelve a intentar el commit.';
  const file = location ? ` Fichero: ${location}.` : '';
  return `Regla: ${rule}.${file}${failure} Solución: ${remediation}`;
};
