import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  detectOpenSpecInstallation,
  evaluateOpenSpecCompatibility,
  isOpenSpecProjectInitialized,
  OPENSPEC_VALIDATE_ALL_COMMAND,
  validateOpenSpecChanges,
} from './openSpecCli';
import { readSddSession, refreshSddSession } from './sessionStore';
import type {
  SddDecision,
  SddEvaluateResult,
  SddStage,
  SddStatusPayload,
} from './types';

const SDD_SESSION_REFRESH_COMMAND =
  'npx --yes --package pumuki@latest pumuki sdd session --refresh --ttl-minutes=90';

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

const evaluateSessionRequirements = (params: {
  status: SddStatusPayload;
  autoRefreshEnabled: boolean;
  autoRefreshAttempted: boolean;
  autoRefreshError?: string;
}): SddDecision | undefined => {
  const { status } = params;
  if (!status.session.active) {
    return blocked(
      'SDD_SESSION_MISSING',
      'SDD session is not active. Run `pumuki sdd session --open --change=<id>`.'
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
    }),
  };
};

export const readSddStatus = (repoRoot?: string): SddStatusPayload =>
  buildStatus(repoRoot ?? process.cwd());
