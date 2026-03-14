import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type DegradedStage = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
export type DegradedAction = 'allow' | 'block';
export type DegradedCode = 'DEGRADED_MODE_ALLOWED' | 'DEGRADED_MODE_BLOCKED';

export type DegradedResolution = {
  enabled: true;
  action: DegradedAction;
  reason: string;
  source: 'env' | 'file:.pumuki/degraded-mode.json';
  code: DegradedCode;
};

const DEGRADED_MODE_FILE_PATH = '.pumuki/degraded-mode.json';

const toBooleanFlag = (value: string | undefined): boolean | null => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return null;
};

const toAction = (value: unknown): DegradedAction | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'allow') {
    return 'allow';
  }
  if (normalized === 'block') {
    return 'block';
  }
  return null;
};

const toCode = (action: DegradedAction): DegradedCode => {
  return action === 'block' ? 'DEGRADED_MODE_BLOCKED' : 'DEGRADED_MODE_ALLOWED';
};

const resolveActionFromEnv = (stage: DegradedStage): DegradedAction => {
  const stageKey = `PUMUKI_DEGRADED_ACTION_${stage}`;
  const byStage = toAction(process.env[stageKey]);
  if (byStage) {
    return byStage;
  }
  const globalAction = toAction(process.env.PUMUKI_DEGRADED_ACTION);
  if (globalAction) {
    return globalAction;
  }
  return 'allow';
};

type DegradedModeFile = {
  version?: unknown;
  enabled?: unknown;
  reason?: unknown;
  action?: unknown;
  stages?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const resolveFromFile = (
  repoRoot: string,
  stage: DegradedStage
): DegradedResolution | undefined => {
  const configPath = join(repoRoot, DEGRADED_MODE_FILE_PATH);
  if (!existsSync(configPath)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as DegradedModeFile;
    if (parsed.enabled !== true) {
      return undefined;
    }
    const stageActions = isRecord(parsed.stages) ? parsed.stages : undefined;
    const stageAction = stageActions ? toAction(stageActions[stage]) : null;
    const globalAction = toAction(parsed.action);
    const action = stageAction ?? globalAction ?? 'allow';
    const reason =
      typeof parsed.reason === 'string' && parsed.reason.trim().length > 0
        ? parsed.reason.trim()
        : 'degraded-mode';
    return {
      enabled: true,
      action,
      reason,
      source: 'file:.pumuki/degraded-mode.json',
      code: toCode(action),
    };
  } catch {
    return undefined;
  }
};

export const resolveDegradedMode = (
  stage: DegradedStage,
  repoRoot: string = process.cwd()
): DegradedResolution | undefined => {
  const enabledFromEnv = toBooleanFlag(process.env.PUMUKI_DEGRADED_MODE);
  if (enabledFromEnv === true) {
    const action = resolveActionFromEnv(stage);
    const reason =
      process.env.PUMUKI_DEGRADED_REASON?.trim().length
        ? process.env.PUMUKI_DEGRADED_REASON.trim()
        : 'degraded-mode';
    return {
      enabled: true,
      action,
      reason,
      source: 'env',
      code: toCode(action),
    };
  }
  if (enabledFromEnv === false) {
    return undefined;
  }
  return resolveFromFile(repoRoot, stage);
};
