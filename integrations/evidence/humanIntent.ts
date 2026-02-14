import type { AiEvidenceV2_1, HumanIntentConfidence, HumanIntentState } from './schema';

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTextList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const text = normalizeText(item);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    result.push(text);
  }
  return result;
};

const normalizeDateIso = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }
  const date = Date.parse(normalized);
  if (!Number.isFinite(date)) {
    return null;
  }
  return new Date(date).toISOString();
};

const normalizeConfidence = (value: unknown): HumanIntentConfidence => {
  if (value === 'high' || value === 'medium' || value === 'low' || value === 'unset') {
    return value;
  }
  return 'unset';
};

export const normalizeHumanIntent = (
  value: HumanIntentState | null | undefined
): HumanIntentState | null => {
  if (!value) {
    return null;
  }

  const preservedAt = normalizeDateIso(value.preserved_at);
  if (!preservedAt) {
    return null;
  }
  const hint = normalizeText(value._hint);

  return {
    primary_goal: normalizeText(value.primary_goal),
    secondary_goals: normalizeTextList(value.secondary_goals),
    non_goals: normalizeTextList(value.non_goals),
    constraints: normalizeTextList(value.constraints),
    confidence_level: normalizeConfidence(value.confidence_level),
    set_by: normalizeText(value.set_by),
    set_at: normalizeDateIso(value.set_at),
    expires_at: normalizeDateIso(value.expires_at),
    preserved_at: preservedAt,
    preservation_count:
      Number.isFinite(value.preservation_count) && value.preservation_count >= 0
        ? Math.trunc(value.preservation_count)
        : 0,
    ...(hint ? { _hint: hint } : {}),
  };
};

export const isHumanIntentExpired = (
  intent: HumanIntentState,
  now: string
): boolean => {
  if (!intent.expires_at) {
    return false;
  }
  const expiresAt = Date.parse(intent.expires_at);
  const nowTime = Date.parse(now);
  if (!Number.isFinite(expiresAt) || !Number.isFinite(nowTime)) {
    return true;
  }
  return expiresAt <= nowTime;
};

export const resolveHumanIntent = (params: {
  now: string;
  inputIntent?: HumanIntentState | null;
  previousEvidence?: Pick<AiEvidenceV2_1, 'human_intent'>;
}): HumanIntentState | null => {
  const candidate = normalizeHumanIntent(
    params.inputIntent ?? params.previousEvidence?.human_intent ?? null
  );
  if (!candidate || isHumanIntentExpired(candidate, params.now)) {
    return null;
  }

  const isExplicitInput = typeof params.inputIntent !== 'undefined';
  const nextCount = isExplicitInput
    ? candidate.preservation_count
    : candidate.preservation_count + 1;

  return {
    ...candidate,
    preserved_at: params.now,
    preservation_count: nextCount,
  };
};
