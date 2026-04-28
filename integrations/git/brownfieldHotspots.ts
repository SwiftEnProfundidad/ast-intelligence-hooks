import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import type { GateStage } from '../../core/gate/GateStage';

type BrownfieldHotspotEntry = {
  path: string;
  reason?: string;
  requires_refactor_plan?: boolean;
  requires_adr?: boolean;
  max_lines?: number;
  refactor_plan_paths?: ReadonlyArray<string>;
  adr_paths?: ReadonlyArray<string>;
};

type BrownfieldHotspotConfig = {
  hotspots: ReadonlyArray<BrownfieldHotspotEntry>;
};

type ObservedFile = {
  path: string;
  lineCount: number | null;
};

const DEFAULT_HOTSPOTS_CONFIG_PATH = 'config/pumuki-hotspots.json';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isStringArray = (value: unknown): value is ReadonlyArray<string> =>
  Array.isArray(value) && value.every((item) => isNonEmptyString(item));

const toNormalizedPath = (value: string): string => value.replace(/\\/g, '/').replace(/^\.\//, '');

const toAbsolutePath = (repoRoot: string, candidate: string): string =>
  isAbsolute(candidate) ? candidate : resolve(repoRoot, candidate);

const toLineCount = (content: string): number => content.split('\n').length;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isBrownfieldHotspotEntry = (value: unknown): value is BrownfieldHotspotEntry => {
  if (!isObject(value) || !isNonEmptyString(value.path)) {
    return false;
  }
  if (typeof value.reason !== 'undefined' && !isNonEmptyString(value.reason)) {
    return false;
  }
  if (
    typeof value.requires_refactor_plan !== 'undefined' &&
    typeof value.requires_refactor_plan !== 'boolean'
  ) {
    return false;
  }
  if (typeof value.requires_adr !== 'undefined' && typeof value.requires_adr !== 'boolean') {
    return false;
  }
  if (typeof value.max_lines !== 'undefined' && !isPositiveInteger(value.max_lines)) {
    return false;
  }
  if (
    typeof value.refactor_plan_paths !== 'undefined' &&
    !isStringArray(value.refactor_plan_paths)
  ) {
    return false;
  }
  if (typeof value.adr_paths !== 'undefined' && !isStringArray(value.adr_paths)) {
    return false;
  }
  return true;
};

const isBrownfieldHotspotConfig = (value: unknown): value is BrownfieldHotspotConfig =>
  isObject(value) && Array.isArray(value.hotspots) && value.hotspots.every(isBrownfieldHotspotEntry);

const resolveHotspotsConfigPath = (repoRoot: string): string => {
  const configured = process.env.PUMUKI_HOTSPOTS_CONFIG_PATH?.trim();
  if (!configured) {
    return resolve(repoRoot, DEFAULT_HOTSPOTS_CONFIG_PATH);
  }
  return toAbsolutePath(repoRoot, configured);
};

const readBrownfieldHotspotConfig = (repoRoot: string): BrownfieldHotspotConfig | undefined => {
  const configPath = resolveHotspotsConfigPath(repoRoot);
  if (!existsSync(configPath)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(configPath, 'utf8'));
    return isBrownfieldHotspotConfig(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const hasRequiredArtifacts = (
  repoRoot: string,
  candidates: ReadonlyArray<string> | undefined
): boolean => {
  if (!candidates || candidates.length === 0) {
    return false;
  }
  return candidates.some((candidate) => existsSync(toAbsolutePath(repoRoot, candidate)));
};

const collectObservedFiles = (repoRoot: string, facts: ReadonlyArray<Fact>): ReadonlyArray<ObservedFile> => {
  const deleted = new Set<string>();
  const contents = new Map<string, string>();
  const changedPaths = new Set<string>();

  for (const fact of facts) {
    if (fact.kind === 'FileChange') {
      const normalizedPath = toNormalizedPath(fact.path);
      changedPaths.add(normalizedPath);
      if (fact.changeType === 'deleted') {
        deleted.add(normalizedPath);
      }
      continue;
    }
    if (fact.kind === 'FileContent') {
      const normalizedPath = toNormalizedPath(fact.path);
      changedPaths.add(normalizedPath);
      contents.set(normalizedPath, fact.content);
    }
  }

  return [...changedPaths]
    .filter((path) => !deleted.has(path))
    .sort((left, right) => left.localeCompare(right))
    .map((path) => {
      const inlineContent = contents.get(path);
      if (typeof inlineContent === 'string') {
        return {
          path,
          lineCount: toLineCount(inlineContent),
        };
      }
      const absolutePath = resolve(repoRoot, path);
      if (!existsSync(absolutePath)) {
        return {
          path,
          lineCount: null,
        };
      }
      try {
        return {
          path,
          lineCount: toLineCount(readFileSync(absolutePath, 'utf8')),
        };
      } catch {
        return {
          path,
          lineCount: null,
        };
      }
    });
};

const toHotspotSizeFinding = (params: {
  stage: GateStage;
  path: string;
  lineCount: number;
  threshold: number;
  severity: 'ERROR' | 'CRITICAL';
  reason?: string;
}): Finding => ({
  ruleId: 'governance.hotspot.file_over_limit',
  severity: params.severity,
  code:
    params.severity === 'CRITICAL'
      ? 'HOTSPOT_FILE_OVER_LIMIT_CRITICAL'
      : 'HOTSPOT_FILE_OVER_LIMIT_HIGH',
  message:
    'BLOCKED: file over structural limit; split plan or ADR required before further edits. ' +
    `stage=${params.stage} file=${params.path} lines=${params.lineCount} threshold=${params.threshold}` +
    (params.reason ? ` reason=${params.reason}` : ''),
  filePath: params.path,
  matchedBy: 'BrownfieldHotspotGuard',
  source: 'brownfield-hotspot',
});

const toMissingPlanFinding = (params: {
  stage: GateStage;
  path: string;
  reason?: string;
}): Finding => ({
  ruleId: 'governance.hotspot.flagged_file_without_plan',
  severity: 'ERROR',
  code: 'HOTSPOT_FLAGGED_FILE_WITHOUT_PLAN',
  message:
    'BLOCKED: touching flagged hotspot without approved refactor plan. ' +
    `stage=${params.stage} file=${params.path} required=refactor_plan` +
    (params.reason ? ` reason=${params.reason}` : ''),
  filePath: params.path,
  matchedBy: 'BrownfieldHotspotGuard',
  source: 'brownfield-hotspot',
});

const toMissingAdrFinding = (params: {
  stage: GateStage;
  path: string;
  reason?: string;
}): Finding => ({
  ruleId: 'governance.hotspot.missing_adr_for_structural_change',
  severity: 'CRITICAL',
  code: 'HOTSPOT_MISSING_ADR_FOR_STRUCTURAL_CHANGE',
  message:
    'BLOCKED: structural brownfield change requires ADR. ' +
    `stage=${params.stage} file=${params.path} required=adr` +
    (params.reason ? ` reason=${params.reason}` : ''),
  filePath: params.path,
  matchedBy: 'BrownfieldHotspotGuard',
  source: 'brownfield-hotspot',
});

export const evaluateBrownfieldHotspotFindings = (params: {
  repoRoot: string;
  stage: GateStage;
  facts: ReadonlyArray<Fact>;
}): ReadonlyArray<Finding> => {
  if (params.stage !== 'PRE_WRITE' && params.stage !== 'PRE_COMMIT') {
    return [];
  }

  const config = readBrownfieldHotspotConfig(params.repoRoot);
  const observedFiles = collectObservedFiles(params.repoRoot, params.facts);
  const configByPath = new Map(
    (config?.hotspots ?? []).map((entry) => [toNormalizedPath(entry.path), entry] as const)
  );
  const findings: Finding[] = [];

  for (const file of observedFiles) {
    const configEntry = configByPath.get(file.path);
    if (typeof file.lineCount === 'number' && configEntry?.max_lines) {
      const threshold = configEntry.max_lines;
      if (file.lineCount > threshold) {
        findings.push(
          toHotspotSizeFinding({
            stage: params.stage,
            path: file.path,
            lineCount: file.lineCount,
            threshold,
            severity: 'ERROR',
            reason: configEntry?.reason,
          })
        );
      }
    }

    if (!configEntry) {
      continue;
    }

    if (
      configEntry.requires_refactor_plan === true &&
      !hasRequiredArtifacts(params.repoRoot, configEntry.refactor_plan_paths)
    ) {
      findings.push(
        toMissingPlanFinding({
          stage: params.stage,
          path: file.path,
          reason: configEntry.reason,
        })
      );
    }

    if (
      configEntry.requires_adr === true &&
      !hasRequiredArtifacts(params.repoRoot, configEntry.adr_paths)
    ) {
      findings.push(
        toMissingAdrFinding({
          stage: params.stage,
          path: file.path,
          reason: configEntry.reason,
        })
      );
    }
  }

  return findings;
};
