import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  detectOpenSpecInstallation,
  evaluateOpenSpecCompatibility,
  isOpenSpecProjectInitialized,
  OPENSPEC_VALIDATE_ALL_COMMAND,
  validateOpenSpecChanges,
} from './openSpecCli';
import {
  listActiveOpenSpecChangeIds,
  readSddSession,
  refreshSddSession,
} from './sessionStore';
import type { ILifecycleGitService } from '../lifecycle/gitService';
import { resolveDegradedMode } from '../gate/degradedMode';
import { getCurrentPumukiVersion } from '../lifecycle/packageInfo';
import { resolveSddCompletenessEnforcement } from '../policy/sddCompletenessEnforcement';
import { resolveSddExperimentalFeature } from '../policy/experimentalFeatures';
import type {
  SddDecision,
  SddEvaluateResult,
  SddStage,
  SddStatusPayload,
} from './types';

const SDD_COMPLETENESS_CONTRACT_VERSION = '1.0';

const buildPinnedPumukiNpxCommand = (version: string): string =>
  `npx --yes --package pumuki@${version} pumuki`;
const buildSddSessionRefreshCommand = (repoRoot: string): string =>
  `${buildPinnedPumukiNpxCommand(getCurrentPumukiVersion({ repoRoot }))} sdd session --refresh --ttl-minutes=90`;
const buildSddSessionOpenAutoCommand = (repoRoot: string): string =>
  `${buildPinnedPumukiNpxCommand(getCurrentPumukiVersion({ repoRoot }))} sdd session --open --change=auto`;
const buildSddSessionOpenExplicitCommand = (repoRoot: string): string =>
  `${buildPinnedPumukiNpxCommand(getCurrentPumukiVersion({ repoRoot }))} sdd session --open --change=<id>`;
const buildSddExperimentalEnableCommand = (stage: SddStage, repoRoot: string): string =>
  `PUMUKI_EXPERIMENTAL_SDD=advisory ${buildPinnedPumukiNpxCommand(
    getCurrentPumukiVersion({ repoRoot })
  )} sdd validate --stage=${stage} --json`;

const resolveMissingSessionGuidance = (repoRoot: string): {
  message: string;
  command: string;
  fallbackCommand: string;
  suggestedChangeId?: string;
  availableChangeIds: ReadonlyArray<string>;
} => {
  const sessionOpenAutoCommand = buildSddSessionOpenAutoCommand(repoRoot);
  const sessionOpenExplicitCommand = buildSddSessionOpenExplicitCommand(repoRoot);
  const availableChangeIds = listActiveOpenSpecChangeIds(repoRoot);
  if (availableChangeIds.length === 1) {
    const suggestedChangeId = availableChangeIds[0] ?? '';
    const command =
      `${buildPinnedPumukiNpxCommand(getCurrentPumukiVersion({ repoRoot }))} sdd session --open --change=${suggestedChangeId}`;
    return {
      message: `SDD session is not active. Run \`${command}\` and retry.`,
      command,
      fallbackCommand: sessionOpenAutoCommand,
      suggestedChangeId,
      availableChangeIds,
    };
  }
  if (availableChangeIds.length > 1) {
    return {
      message:
        `SDD session is not active. Run \`${sessionOpenExplicitCommand}\` ` +
        `with one active change id. Active changes: ${availableChangeIds.join(', ')}.`,
      command: sessionOpenExplicitCommand,
      fallbackCommand: sessionOpenExplicitCommand,
      availableChangeIds,
    };
  }
  return {
    message: `SDD session is not active. Run \`${sessionOpenAutoCommand}\` and retry.`,
    command: sessionOpenAutoCommand,
    fallbackCommand: sessionOpenAutoCommand,
    availableChangeIds,
  };
};

const buildStatus = (repoRoot: string, git?: ILifecycleGitService): SddStatusPayload => {
  const openspec = detectOpenSpecInstallation(repoRoot);
  const compatibility = evaluateOpenSpecCompatibility(openspec);
  const session = readSddSession(repoRoot, git);
  return {
    repoRoot,
    openspec: {
      installed: openspec.installed,
      version: openspec.version,
      projectInitialized: isOpenSpecProjectInitialized(repoRoot),
      minimumVersion: compatibility.minimumVersion,
      recommendedVersion: compatibility.recommendedVersion,
      compatible: compatibility.compatible,
      parsedVersion: compatibility.parsedVersion,
    },
    session,
  };
};

const allowed = (message: string, details?: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): SddDecision => ({
  allowed: true,
  code: 'ALLOWED',
  message,
  details,
});

const blocked = (
  code: Exclude<SddDecision['code'], 'ALLOWED'>,
  message: string,
  details?: Record<string, string | number | boolean | bigint | symbol | null | Date | object>
): SddDecision => ({
  allowed: false,
  code,
  message,
  details,
});

const activeChangeExists = (repoRoot: string, changeId: string): boolean =>
  existsSync(resolve(repoRoot, 'openspec', 'changes', changeId));

const activeChangeArchived = (repoRoot: string, changeId: string): boolean =>
  existsSync(resolve(repoRoot, 'openspec', 'changes', 'archive', changeId));

const evaluateActiveChangeCompleteness = (params: {
  repoRoot: string;
  changeId: string;
}): {
  complete: boolean;
  missingRequirements: string[];
} => {
  const changeRoot = resolve(params.repoRoot, 'openspec', 'changes', params.changeId);
  const proposalPath = resolve(changeRoot, 'proposal.md');
  const tasksPath = resolve(changeRoot, 'tasks.md');
  const scenarioPath = resolve(changeRoot, 'scenario.feature');
  const missingRequirements: string[] = [];

  if (!existsSync(proposalPath)) {
    missingRequirements.push('proposal.md');
  }
  if (!existsSync(tasksPath)) {
    missingRequirements.push('tasks.md');
  }
  if (!existsSync(scenarioPath)) {
    missingRequirements.push('scenario.feature');
  } else {
    try {
      const scenarioContent = readFileSync(scenarioPath, 'utf8');
      const hasFeatureHeader = /^\s*Feature:\s+/im.test(scenarioContent);
      const hasScenarioBody = /^\s*Scenario(?: Outline)?:\s+/im.test(scenarioContent);
      if (!hasFeatureHeader) {
        missingRequirements.push('scenario.feature#Feature');
      }
      if (!hasScenarioBody) {
        missingRequirements.push('scenario.feature#Scenario');
      }
    } catch {
      missingRequirements.push('scenario.feature#readable');
    }
  }

  return {
    complete: missingRequirements.length === 0,
    missingRequirements,
  };
};

const evaluateSessionRequirements = (params: {
  status: SddStatusPayload;
  repoRoot: string;
  autoRefreshEnabled: boolean;
  autoRefreshAttempted: boolean;
  autoRefreshError?: string;
}): SddDecision | undefined => {
  const { status } = params;
  if (!status.session.changeId) {
    const guidance = resolveMissingSessionGuidance(status.repoRoot);
    const details: Record<string, string | number | boolean | bigint | symbol | null | Date | object> = {
      command: guidance.command,
      fallbackCommand: guidance.fallbackCommand,
      availableChangeIds: [...guidance.availableChangeIds],
    };
    if (guidance.suggestedChangeId) {
      details.suggestedChangeId = guidance.suggestedChangeId;
    }
    return blocked(
      'SDD_SESSION_MISSING',
      guidance.message,
      details
    );
  }
  if (!status.session.valid || !status.session.changeId) {
    const refreshCommand = buildSddSessionRefreshCommand(params.repoRoot);
    const details: Record<string, string | boolean> = {
      command: refreshCommand,
      autoRefreshEnabled: params.autoRefreshEnabled,
      autoRefreshAttempted: params.autoRefreshAttempted,
    };
    if (params.autoRefreshError) {
      details.autoRefreshError = params.autoRefreshError;
    }
    const message =
      params.autoRefreshAttempted && params.autoRefreshError
        ? `SDD session is invalid or expired. Auto-refresh failed (${params.autoRefreshError}). Run \`${refreshCommand}\` or reopen it.`
        : `SDD session is invalid or expired. Run \`${refreshCommand}\` or reopen it.`;
    return blocked(
      'SDD_SESSION_INVALID',
      message,
      details
    );
  }
  if (activeChangeArchived(status.repoRoot, status.session.changeId)) {
    return blocked(
      'SDD_CHANGE_ARCHIVED',
      `Active SDD change "${status.session.changeId}" is archived. Open a new active change session.`
    );
  }
  if (!activeChangeExists(status.repoRoot, status.session.changeId)) {
    return blocked(
      'SDD_CHANGE_MISSING',
      `Active SDD change "${status.session.changeId}" was not found in openspec/changes.`
    );
  }
  return undefined;
};

const shouldAttemptSessionAutoRefresh = (params: {
  stage: SddStage;
  status: SddStatusPayload;
  autoRefreshEnabled: boolean;
}): boolean =>
  params.stage !== 'PRE_WRITE'
  && params.autoRefreshEnabled
  && !!params.status.session.changeId
  && !params.status.session.valid;

const trySessionAutoRefresh = (repoRoot: string): {
  refreshed: boolean;
  error?: string;
} => {
  try {
    refreshSddSession({
      cwd: repoRoot,
      ttlMinutes: 90,
    });
    return { refreshed: true };
  } catch (error) {
    return {
      refreshed: false,
      error: error instanceof Error ? error.message : 'Unknown auto-refresh error',
    };
  }
};

export const evaluateSddPolicy = (params: {
  stage: SddStage;
  repoRoot?: string;
}): SddEvaluateResult => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const bypassEnabled = process.env.PUMUKI_SDD_BYPASS === '1';
  const autoRefreshEnabled = process.env.PUMUKI_SDD_AUTO_REFRESH_SESSION !== '0';
  const strictEmptyItemsEnabled = process.env.PUMUKI_SDD_STRICT_EMPTY_ITEMS !== '0';
  const completenessEnforcement = resolveSddCompletenessEnforcement();
  const sddExperimentalFeature = resolveSddExperimentalFeature();
  let status = buildStatus(repoRoot);
  let autoRefreshAttempted = false;
  let autoRefreshError: string | undefined;
  const finalizeResult = (result: SddEvaluateResult): SddEvaluateResult => {
    const details = {
      ...(result.decision.details ?? {}),
      experimental: true,
      experimentalFeature: 'sdd',
      experimentalLayer: sddExperimentalFeature.layer,
      experimentalMode: sddExperimentalFeature.mode,
      experimentalSource: sddExperimentalFeature.source,
      activation_env: sddExperimentalFeature.activationVariable,
      legacy_activation_env: sddExperimentalFeature.legacyActivationVariable,
    };

    if (sddExperimentalFeature.mode !== 'advisory' || result.decision.allowed) {
      return {
        ...result,
        decision: {
          ...result.decision,
          details,
        },
      };
    }

    return {
      ...result,
      decision: {
        ...result.decision,
        allowed: true,
        message:
          `SDD/OpenSpec está activo en modo advisory y no bloquea por defecto. ${result.decision.message}`,
        details: {
          ...details,
          advisory: true,
          blocking: false,
          advisory_reason_code: result.decision.code,
        },
      },
    };
  };

  if (bypassEnabled) {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: allowed(
        'SDD bypass is active via PUMUKI_SDD_BYPASS=1. Enforcement skipped by emergency override.',
        {
          bypass: true,
          env: 'PUMUKI_SDD_BYPASS',
        }
      ),
    });
  }

  if (sddExperimentalFeature.mode === 'off') {
    return {
      stage: params.stage,
      status,
      decision: {
        allowed: true,
        code: 'SDD_EXPERIMENTAL_DISABLED',
        message:
          'SDD/OpenSpec pertenece al namespace experimental y está desactivado por defecto. Actívalo explícitamente con PUMUKI_EXPERIMENTAL_SDD=advisory o strict si necesitas este flujo.',
        details: {
          experimental: true,
          default_off: true,
          layer: sddExperimentalFeature.layer,
          experimentalFeature: 'sdd',
          experimentalMode: sddExperimentalFeature.mode,
          experimentalSource: sddExperimentalFeature.source,
          activation_env: sddExperimentalFeature.activationVariable,
          legacy_activation_env: sddExperimentalFeature.legacyActivationVariable,
          activation_command: buildSddExperimentalEnableCommand(params.stage, repoRoot),
        },
      },
    };
  }

  const degradedMode = resolveDegradedMode(params.stage, repoRoot);
  if (degradedMode?.action === 'block') {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: blocked(
        'SDD_DEGRADED_MODE_BLOCKED',
        `SDD blocked by degraded mode (action=block). reason=${degradedMode.reason} source=${degradedMode.source}.`,
        {
          degraded_mode: true,
          degraded_action: degradedMode.action,
          degraded_reason: degradedMode.reason,
          degraded_source: degradedMode.source,
          degraded_code: degradedMode.code,
        }
      ),
    });
  }

  if (degradedMode?.action === 'allow') {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: allowed(
        `SDD allowed in degraded mode (action=allow). reason=${degradedMode.reason} source=${degradedMode.source}.`,
        {
          degraded_mode: true,
          degraded_action: degradedMode.action,
          degraded_reason: degradedMode.reason,
          degraded_source: degradedMode.source,
          degraded_code: degradedMode.code,
        }
      ),
    });
  }

  if (!status.openspec.installed) {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: blocked(
        'OPENSPEC_MISSING',
        'OpenSpec is required but was not detected. Install OpenSpec before continuing.'
      ),
    });
  }

  if (!status.openspec.compatible) {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: blocked(
        'OPENSPEC_VERSION_UNSUPPORTED',
        `OpenSpec version is unsupported. Minimum required is ${status.openspec.minimumVersion} (detected: ${status.openspec.version ?? 'unknown'}).`
      ),
    });
  }

  if (!status.openspec.projectInitialized) {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: blocked(
        'OPENSPEC_PROJECT_MISSING',
        'OpenSpec project is not initialized in this repository. Run OpenSpec init/bootstrap.'
      ),
    });
  }

  if (
    shouldAttemptSessionAutoRefresh({
      stage: params.stage,
      status,
      autoRefreshEnabled,
    })
  ) {
    autoRefreshAttempted = true;
    const refreshAttempt = trySessionAutoRefresh(repoRoot);
    if (refreshAttempt.refreshed) {
      status = buildStatus(repoRoot);
    } else {
      autoRefreshError = refreshAttempt.error;
    }
  }

  const sessionDecision = evaluateSessionRequirements({
    status,
    repoRoot,
    autoRefreshEnabled,
    autoRefreshAttempted,
    autoRefreshError,
  });
  if (sessionDecision) {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: sessionDecision,
    });
  }

  if (params.stage === 'PRE_WRITE') {
    return finalizeResult({
      stage: params.stage,
      status,
      decision: allowed('SDD pre-write checks passed with active valid session.'),
    });
  }

  const validation = validateOpenSpecChanges(repoRoot);
  if (!validation.ok) {
    return finalizeResult({
      stage: params.stage,
      status,
      validation,
      decision: blocked(
        validation.exitCode !== 0 ? 'SDD_VALIDATION_FAILED' : 'SDD_VALIDATION_ERROR',
        'OpenSpec validation failed for active changes. Resolve SDD issues before continuing.',
        {
          command: OPENSPEC_VALIDATE_ALL_COMMAND,
          exitCode: validation.exitCode,
          failedItems: validation.totals.failed,
          errors: validation.issues.errors,
        }
      ),
    });
  }

  if (strictEmptyItemsEnabled && validation.totals.items <= 0) {
    return finalizeResult({
      stage: params.stage,
      status,
      validation,
      decision: blocked(
        'SDD_VALIDATION_EMPTY_SCOPE',
        'OpenSpec validation returned an empty scope (items=0) in strict mode. This is blocked to avoid false-green SDD gates.',
        {
          command: OPENSPEC_VALIDATE_ALL_COMMAND,
          stage: params.stage,
          items: validation.totals.items,
          strictEmptyItemsEnabled,
          overrideEnv: 'PUMUKI_SDD_STRICT_EMPTY_ITEMS=0',
        }
      ),
    });
  }

  const activeChangeId = status.session.changeId;
  let completeness = undefined as
    | {
      complete: boolean;
      missingRequirements: string[];
    }
    | undefined;
  if (
    activeChangeId &&
    (params.stage === 'PRE_PUSH' || params.stage === 'CI')
  ) {
    completeness = evaluateActiveChangeCompleteness({
      repoRoot,
      changeId: activeChangeId,
    });
    if (!completeness.complete && completenessEnforcement.blocking) {
      return finalizeResult({
        stage: params.stage,
        status,
        validation,
        decision: blocked(
          'SDD_CHANGE_INCOMPLETE',
          'Active SDD change is incomplete for strict PRE_PUSH/CI enforcement. Ensure proposal/tasks/scenario contract is complete before continuing.',
          {
            command: OPENSPEC_VALIDATE_ALL_COMMAND,
            stage: params.stage,
            changeId: activeChangeId,
            contractVersion: SDD_COMPLETENESS_CONTRACT_VERSION,
            missingRequirements: completeness.missingRequirements,
            completenessEnforcementMode: completenessEnforcement.mode,
            completenessEnforcementSource: completenessEnforcement.source,
            completenessBlocking: completenessEnforcement.blocking,
            overrideEnv: 'PUMUKI_SDD_ENFORCE_COMPLETENESS=advisory',
          }
        ),
      });
    }
  }

  return finalizeResult({
    stage: params.stage,
    status,
    validation,
    decision: allowed(
      completeness?.complete === false
        ? 'SDD validation passed; active change completeness remains advisory for this stage.'
        : 'SDD validation passed for active changes.',
      {
        command: OPENSPEC_VALIDATE_ALL_COMMAND,
        passedItems: validation.totals.passed,
        validatedItems: validation.totals.items,
        warnings: validation.issues.warnings,
        emptyScope: validation.totals.items <= 0,
        strictEmptyItemsEnabled,
        completenessEnforcementMode: completenessEnforcement.mode,
        completenessEnforcementSource: completenessEnforcement.source,
        completenessBlocking: completenessEnforcement.blocking,
        completenessContractVersion: SDD_COMPLETENESS_CONTRACT_VERSION,
        completenessStatus: completeness?.complete === false ? 'incomplete-advisory' : 'complete',
        missingCompletenessRequirements: completeness?.complete === false
          ? completeness.missingRequirements
          : [],
      }
    ),
  });
};

export const readSddStatus = (repoRoot?: string, git?: ILifecycleGitService): SddStatusPayload =>
  buildStatus(repoRoot ?? process.cwd(), git);
