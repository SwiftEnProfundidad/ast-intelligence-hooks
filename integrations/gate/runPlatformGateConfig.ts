const parseConfidence = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const LIST_SEPARATOR = ', ';

export const MEMORY_SHADOW_CONFIDENCE_BLOCK = parseConfidence(
  process.env.PUMUKI_MEMORY_SHADOW_CONFIDENCE_BLOCK,
  0.9
);
export const MEMORY_SHADOW_CONFIDENCE_WARN = parseConfidence(
  process.env.PUMUKI_MEMORY_SHADOW_CONFIDENCE_WARN,
  0.75
);
export const MEMORY_SHADOW_CONFIDENCE_WARN_ADVISORY = parseConfidence(
  process.env.PUMUKI_MEMORY_SHADOW_CONFIDENCE_WARN_ADVISORY,
  0.7
);
export const MEMORY_SHADOW_CONFIDENCE_ALLOW = parseConfidence(
  process.env.PUMUKI_MEMORY_SHADOW_CONFIDENCE_ALLOW,
  0.65
);

export const DEGRADED_MODE_ACTION_BLOCK =
  process.env.PUMUKI_DEGRADED_MODE_ACTION_BLOCK?.trim() || 'block';
export const DEGRADED_MODE_ACTION_ALLOW =
  process.env.PUMUKI_DEGRADED_MODE_ACTION_ALLOW?.trim() || 'allow';
