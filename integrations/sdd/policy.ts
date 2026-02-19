import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  detectOpenSpecInstallation,
  evaluateOpenSpecCompatibility,
  isOpenSpecProjectInitialized,
  validateOpenSpecChanges,
} from './openSpecCli';
import { readSddSession } from './sessionStore';
import type {
  SddDecision,
  SddEvaluateResult,
  SddStage,
  SddStatusPayload,
} from './types';

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

const allowed = (message: string, details?: Record<string, unknown>): SddDecision => ({
  allowed: true,
  code: 'ALLOWED',
  message,
  details,
});

const blocked = (
  code: Exclude<SddDecision['code'], 'ALLOWED'>,
  message: string,
  details?: Record<string, unknown>
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

const evaluateSessionRequirements = (status: SddStatusPayload): SddDecision | undefined => {
  if (!status.session.active) {
    return blocked(
      'SDD_SESSION_MISSING',
      'SDD session is not active. Run `pumuki sdd session --open --change=<id>`.'
    );
  }
  if (!status.session.valid || !status.session.changeId) {
    return blocked(
      'SDD_SESSION_INVALID',
      'SDD session is invalid or expired. Run `pumuki sdd session --refresh` or reopen it.'
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

export const evaluateSddPolicy = (params: {
  stage: SddStage;
  repoRoot?: string;
}): SddEvaluateResult => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const bypassEnabled = process.env.PUMUKI_SDD_BYPASS === '1';
  const status = buildStatus(repoRoot);

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

  const sessionDecision = evaluateSessionRequirements(status);
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
          exitCode: validation.exitCode,
          failedItems: validation.totals.failed,
          errors: validation.issues.errors,
        }
      ),
    };
  }

  return {
    stage: params.stage,
    status,
    validation,
    decision: allowed('SDD validation passed for active changes.', {
      passedItems: validation.totals.passed,
      warnings: validation.issues.warnings,
    }),
  };
};

export const readSddStatus = (repoRoot?: string): SddStatusPayload =>
  buildStatus(repoRoot ?? process.cwd());
