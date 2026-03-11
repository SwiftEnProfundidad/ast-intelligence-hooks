import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSddSession } from './sessionStore';

type LearningArtifact = {
  generated_at?: unknown;
  failed_patterns?: unknown;
  successful_patterns?: unknown;
  rule_updates?: unknown;
  gate_anomalies?: unknown;
};

export type SddLearningContext = {
  change: string;
  path: string;
  generated_at: string | null;
  failed_patterns: string[];
  successful_patterns: string[];
  rule_updates: string[];
  gate_anomalies: string[];
  recommended_actions: string[];
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const toRecommendedActions = (ruleUpdates: string[]): string[] => {
  const actions: string[] = [];
  for (const rule of ruleUpdates) {
    if (rule === 'evidence.bootstrap.required' || rule === 'evidence.rebuild.required') {
      actions.push(
        'Regenera evidencia y vuelve a validar PRE_WRITE para estabilizar el gate.'
      );
      continue;
    }
    if (rule.startsWith('ai-gate.violation.')) {
      actions.push('Corrige la violación de gate indicada y reejecuta validate/hook.');
      continue;
    }
    if (rule.startsWith('sdd.')) {
      actions.push('Completa el contrato SDD del cambio activo antes de cerrar stage.');
      continue;
    }
  }
  return [...new Set(actions)];
};

export const readSddLearningContext = (params: {
  repoRoot: string;
  change?: string | null;
}): SddLearningContext | null => {
  const repoRoot = resolve(params.repoRoot);
  const explicitChange = params.change?.trim().toLowerCase() ?? null;
  const session = readSddSession(repoRoot);
  const change = explicitChange ?? session.changeId ?? null;
  if (!change) {
    return null;
  }

  const relativePath = `openspec/changes/${change}/learning.json`;
  const absolutePath = resolve(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }

  let parsed: LearningArtifact;
  try {
    parsed = JSON.parse(readFileSync(absolutePath, 'utf8')) as LearningArtifact;
  } catch {
    return null;
  }

  const ruleUpdates = toStringArray(parsed.rule_updates);
  return {
    change,
    path: relativePath,
    generated_at:
      typeof parsed.generated_at === 'string' && parsed.generated_at.trim().length > 0
        ? parsed.generated_at
        : null,
    failed_patterns: toStringArray(parsed.failed_patterns),
    successful_patterns: toStringArray(parsed.successful_patterns),
    rule_updates: ruleUpdates,
    gate_anomalies: toStringArray(parsed.gate_anomalies),
    recommended_actions: toRecommendedActions(ruleUpdates),
  };
};
