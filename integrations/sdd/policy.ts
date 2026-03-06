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
import { resolveDegradedMode } from '../gate/degradedMode';
import type {
  SddDecision,
  SddEvaluateResult,
  SddStage,
  SddStatusPayload,
} from './types';

const SDD_SESSION_REFRESH_COMMAND =
  'npx --yes --package pumuki@latest pumuki sdd session --refresh --ttl-minutes=90';
const SDD_SESSION_OPEN_AUTO_COMMAND =
  'npx --yes --package pumuki@latest pumuki sdd session --open --change=auto';
const SDD_SESSION_OPEN_EXPLICIT_COMMAND =
  'npx --yes --package pumuki@latest pumuki sdd session --open --change=<id>';
const SDD_COMPLETENESS_CONTRACT_VERSION = '1.0';

const resolveMissingSessionGuidance = (repoRoot: string): {
  message: string;
  command: string;
  fallbackCommand: string;
  suggestedChangeId?: string;
  availableChangeIds: ReadonlyArray<string>;
} => {
  const availableChangeIds = listActiveOpenSpecChangeIds(repoRoot);
  if (availableChangeIds.length === 1) {
    const suggestedChangeId = availableChangeIds[0] ?? '';
    const command =
      `npx --yes --package pumuki@latest pumuki sdd session --open --change=${suggestedChangeId}`;
    return {
      message: `SDD session is not active. Run \`${command}\` and retry.`,
      command,
      fallbackCommand: SDD_SESSION_OPEN_AUTO_COMMAND,
      suggestedChangeId,
      availableChangeIds,
    };
  }
  if (availableChangeIds.length > 1) {
    return {
      message:
        `SDD session is not active. Run \`${SDD_SESSION_OPEN_EXPLICIT_COMMAND}\` ` +
        `with one active change id. Active changes: ${availableChangeIds.join(', ')}.`,
      command: SDD_SESSION_OPEN_EXPLICIT_COMMAND,
      fallbackCommand: SDD_SESSION_OPEN_EXPLICIT_COMMAND,
      availableChangeIds,
    };
  }
  return {
    message: `SDD session is not active. Run \`${SDD_SESSION_OPEN_AUTO_COMMAND}\` and retry.`,
    command: SDD_SESSION_OPEN_AUTO_COMMAND,
    fallbackCommand: SDD_SESSION_OPEN_AUTO_COMMAND,
    availableChangeIds,
  };
};

const buildStatus = (repoRoot: string): SddStatusPayload => {
  const openspec = detectOpenSpecInstallation(repoRoot);
  const compatibility = evaluateOpenSpecCompatibility(openspec);
  const session = readSddSession(repoRoot);
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
  autoRefreshEnabled: boolean;
  autoRefreshAttempted: boolean;
  autoRefreshError?: string;
}): SddDecision | undefined => {
  const { status } = params;
  if (!status.session.active) {
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
    const details: Record<string, string | boolean> = {
      command: SDD_SESSION_REFRESH_COMMAND,
      autoRefreshEnabled: params.autoRefreshEnabled,
      autoRefreshAttempted: params.autoRefreshAttempted,
    };
    if (params.autoRefreshError) {
      details.autoRefreshError = params.autoRefreshError;
    }
    const message =
      params.autoRefreshAttempted && params.autoRefreshError
        ? `SDD session is invalid or expired. Auto-refresh failed (${params.autoRefreshError}). Run \`${SDD_SESSION_REFRESH_COMMAND}\` or reopen it.`
        : `SDD session is invalid or expired. Run \`${SDD_SESSION_REFRESH_COMMAND}\` or reopen it.`;
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
  && params.status.session.active
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
  const strictCompletenessEnabled = process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS !== '0';
  let status = buildStatus(repoRoot);
  let autoRefreshAttempted = false;
  let autoRefreshError: string | undefined;

  if (bypassEnabled) {
    return {
      stage: params.stage,
      status,
      decision: allowed(
        'SDD bypass is active via PUMUKI_SDD_BYPASS=1. Enforcement skipped by emergency override.',
        {
          bypass: true,
          env: 'PUMUKI_SDD_BYPASS',
        }
      ),
    };
  }

  const degradedMode = resolveDegradedMode(params.stage, repoRoot);
  if (degradedMode?.action === 'block') {
    return {
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
    };
  }

  if (degradedMode?.action === 'allow') {
    return {
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
    };
  }

  if (!status.openspec.installed) {
    return {
      stage: params.stage,
      status,
      decision: blocked(
        'OPENSPEC_MISSING',
        'OpenSpec is required but was not detected. Install OpenSpec before continuing.'
      ),
    };
  }

  if (!status.openspec.compatible) {
    return {
      stage: params.stage,
      status,
      decision: blocked(
        'OPENSPEC_VERSION_UNSUPPORTED',
        `OpenSpec version is unsupported. Minimum required is ${status.openspec.minimumVersion} (detected: ${status.openspec.version ?? 'unknown'}).`
      ),
    };
  }

  if (!status.openspec.projectInitialized) {
    return {
      stage: params.stage,
      status,
      decision: blocked(
        'OPENSPEC_PROJECT_MISSING',
        'OpenSpec project is not initialized in this repository. Run OpenSpec init/bootstrap.'
      ),
    };
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
    autoRefreshEnabled,
    autoRefreshAttempted,
    autoRefreshError,
  });
  if (sessionDecision) {
    return {
      stage: params.stage,
      status,
      decision: sessionDecision,
    };
  }

  if (params.stage === 'PRE_WRITE') {
    return {
      stage: params.stage,
      status,
      decision: allowed('SDD pre-write checks passed with active valid session.'),
    };
  }

  const validation = validateOpenSpecChanges(repoRoot);
  if (!validation.ok) {
    return {
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
    };
  }

  if (strictEmptyItemsEnabled && validation.totals.items <= 0) {
    return {
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
    };
  }

  const activeChangeId = status.session.changeId;
  if (
    strictCompletenessEnabled &&
    activeChangeId &&
    (params.stage === 'PRE_PUSH' || params.stage === 'CI')
  ) {
    const completeness = evaluateActiveChangeCompleteness({
      repoRoot,
      changeId: activeChangeId,
    });
    if (!completeness.complete) {
      return {
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
            strictCompletenessEnabled,
            overrideEnv: 'PUMUKI_SDD_ENFORCE_COMPLETENESS=0',
          }
        ),
      };
    }
  }

  return {
    stage: params.stage,
    status,
    validation,
    decision: allowed('SDD validation passed for active changes.', {
      command: OPENSPEC_VALIDATE_ALL_COMMAND,
      passedItems: validation.totals.passed,
      validatedItems: validation.totals.items,
      warnings: validation.issues.warnings,
      emptyScope: validation.totals.items <= 0,
      strictEmptyItemsEnabled,
      strictCompletenessEnabled,
      completenessContractVersion: SDD_COMPLETENESS_CONTRACT_VERSION,
    }),
  };
};

export const readSddStatus = (repoRoot?: string): SddStatusPayload =>
  buildStatus(repoRoot ?? process.cwd());
