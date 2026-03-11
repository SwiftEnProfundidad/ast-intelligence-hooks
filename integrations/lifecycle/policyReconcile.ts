import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  readLifecyclePolicyValidationSnapshot,
  type LifecyclePolicyValidationSnapshot,
} from './policyValidationSnapshot';

type PolicyReconcileSeverity = 'INFO' | 'WARN' | 'ERROR';

type PolicyReconcileDriftCode =
  | 'AGENTS_FILE_MISSING'
  | 'AGENTS_REQUIRED_SKILLS_EMPTY'
  | 'SKILLS_LOCK_MISSING'
  | 'SKILLS_LOCK_INVALID'
  | 'AGENTS_REQUIRED_SKILL_MISSING_IN_LOCK'
  | 'POLICY_STAGE_INVALID'
  | 'POLICY_STAGE_UNSIGNED_OR_COMPUTED'
  | 'POLICY_STAGE_SIGNATURE_MISSING'
  | 'POLICY_HASH_DIVERGENCE'
  | 'POLICY_STAGE_NON_STRICT';

export type PolicyReconcileDrift = {
  code: PolicyReconcileDriftCode;
  severity: PolicyReconcileSeverity;
  blocking: boolean;
  message: string;
  remediation: string | null;
  context?: Record<string, unknown>;
};

export type PolicyReconcileReport = {
  command: 'pumuki policy reconcile';
  repoRoot: string;
  generatedAt: string;
  strictRequested: boolean;
  applyRequested: boolean;
  autofix: {
    attempted: boolean;
    status: 'SKIPPED' | 'APPLIED' | 'FAILED';
    actions: string[];
    details: string;
  };
  summary: {
    total: number;
    blocking: number;
    errors: number;
    warnings: number;
    infos: number;
    status: 'PASS' | 'BLOCKED';
  };
  requiredSkills: string[];
  stages: LifecyclePolicyValidationSnapshot['stages'];
  drifts: PolicyReconcileDrift[];
};

const POLICY_AS_CODE_CONTRACT_PATH = '.pumuki/policy-as-code.json';
const POLICY_AUTOFIX_DRIFT_CODES = new Set<PolicyReconcileDriftCode>([
  'POLICY_STAGE_INVALID',
  'POLICY_STAGE_UNSIGNED_OR_COMPUTED',
  'POLICY_STAGE_SIGNATURE_MISSING',
]);

const REQUIRED_SKILL_IDS = [
  'windsurf-rules-ios',
  'swift-concurrency',
  'swiftui-expert-skill',
  'windsurf-rules-frontend',
  'windsurf-rules-backend',
  'windsurf-rules-android',
] as const;

type SkillsLockBundle = {
  name?: string;
  source?: string;
};

const addDrift = (
  drifts: PolicyReconcileDrift[],
  drift: PolicyReconcileDrift
): void => {
  drifts.push(drift);
};

const hasRequiredSkillInLock = (params: {
  requiredSkill: string;
  bundles: SkillsLockBundle[];
}): boolean => {
  const required = params.requiredSkill.toLowerCase();
  return params.bundles.some((bundle) => {
    const name = typeof bundle.name === 'string' ? bundle.name.toLowerCase() : '';
    const source = typeof bundle.source === 'string' ? bundle.source.toLowerCase() : '';
    return name.includes(required) || source.includes(required);
  });
};

const toContractSource = (
  value: LifecyclePolicyValidationSnapshot['stages'][keyof LifecyclePolicyValidationSnapshot['stages']]['source']
): 'default' | 'skills.policy' | 'hard-mode' => {
  if (value === 'skills.policy' || value === 'hard-mode') {
    return value;
  }
  return 'default';
};

const tryApplyPolicyAutofix = (params: {
  report: Omit<PolicyReconcileReport, 'applyRequested' | 'autofix'>;
}): PolicyReconcileReport['autofix'] => {
  const actionableDrifts = params.report.drifts.filter((drift) => POLICY_AUTOFIX_DRIFT_CODES.has(drift.code));
  if (actionableDrifts.length === 0) {
    return {
      attempted: false,
      status: 'SKIPPED',
      actions: [],
      details: 'No policy-as-code drift eligible for autofix.',
    };
  }

  const signatures = {
    PRE_COMMIT: params.report.stages.PRE_COMMIT.signature,
    PRE_PUSH: params.report.stages.PRE_PUSH.signature,
    CI: params.report.stages.CI.signature,
  };
  if (!signatures.PRE_COMMIT || !signatures.PRE_PUSH || !signatures.CI) {
    return {
      attempted: true,
      status: 'FAILED',
      actions: [],
      details: 'Cannot autofix: missing computed signatures for one or more stages.',
    };
  }

  const contractPath = resolve(params.report.repoRoot, POLICY_AS_CODE_CONTRACT_PATH);
  const contract = {
    version: '1.0',
    source: toContractSource(params.report.stages.PRE_COMMIT.source),
    signatures: {
      PRE_COMMIT: signatures.PRE_COMMIT,
      PRE_PUSH: signatures.PRE_PUSH,
      CI: signatures.CI,
    },
    expires_at: '2999-01-01T00:00:00.000Z',
  };

  try {
    mkdirSync(dirname(contractPath), { recursive: true });
    writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`, 'utf8');
    return {
      attempted: true,
      status: 'APPLIED',
      actions: ['WRITE_POLICY_AS_CODE_CONTRACT'],
      details: `Wrote ${POLICY_AS_CODE_CONTRACT_PATH} with deterministic stage signatures.`,
    };
  } catch (error) {
    return {
      attempted: true,
      status: 'FAILED',
      actions: [],
      details: `Autofix failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const runPolicyReconcile = (params?: {
  repoRoot?: string;
  now?: () => Date;
  strict?: boolean;
  apply?: boolean;
}): PolicyReconcileReport => {
  const repoRoot = resolve(params?.repoRoot ?? process.cwd());
  const now = params?.now ?? (() => new Date());
  const strictRequested = params?.strict === true;
  const applyRequested = params?.apply === true;
  const strictEnvPrevious = process.env.PUMUKI_POLICY_STRICT;
  if (strictRequested) {
    process.env.PUMUKI_POLICY_STRICT = '1';
  }
  try {
  const drifts: PolicyReconcileDrift[] = [];

  const agentsPath = resolve(repoRoot, 'AGENTS.md');
  const agentsExists = existsSync(agentsPath);
  let agentsContent = '';
  if (!agentsExists) {
    addDrift(drifts, {
      code: 'AGENTS_FILE_MISSING',
      severity: 'ERROR',
      blocking: true,
      message: 'AGENTS.md is missing. Hard rules cannot be reconciled.',
      remediation: 'Restore AGENTS.md at repository root before continuing.',
      context: {
        path: agentsPath,
      },
    });
  } else {
    agentsContent = readFileSync(agentsPath, 'utf8');
  }

  const requiredSkills = REQUIRED_SKILL_IDS.filter((skillId) =>
    agentsContent.includes(skillId)
  );
  if (agentsExists && requiredSkills.length === 0) {
    addDrift(drifts, {
      code: 'AGENTS_REQUIRED_SKILLS_EMPTY',
      severity: 'WARN',
      blocking: false,
      message:
        'AGENTS.md does not declare any known required skills from hard contract list.',
      remediation: 'Declare required skills explicitly in AGENTS.md to keep policy reconciliation deterministic.',
      context: {
        skills: [...REQUIRED_SKILL_IDS],
      },
    });
  }

  const skillsLockPath = resolve(repoRoot, 'skills.lock.json');
  const skillsLockExists = existsSync(skillsLockPath);
  let bundles: SkillsLockBundle[] = [];
  if (!skillsLockExists) {
    addDrift(drifts, {
      code: 'SKILLS_LOCK_MISSING',
      severity: 'ERROR',
      blocking: true,
      message: 'skills.lock.json is missing.',
      remediation: 'Regenerate skills lock before running strict policy reconciliation.',
      context: {
        path: skillsLockPath,
      },
    });
  } else {
    try {
      const parsed = JSON.parse(readFileSync(skillsLockPath, 'utf8')) as {
        bundles?: SkillsLockBundle[];
      };
      bundles = Array.isArray(parsed.bundles) ? parsed.bundles : [];
      if (!Array.isArray(parsed.bundles)) {
        addDrift(drifts, {
          code: 'SKILLS_LOCK_INVALID',
          severity: 'ERROR',
          blocking: true,
          message: 'skills.lock.json does not contain a valid bundles array.',
          remediation: 'Rebuild skills lock with deterministic compiler output.',
          context: {
            path: skillsLockPath,
          },
        });
      }
    } catch (error) {
      addDrift(drifts, {
        code: 'SKILLS_LOCK_INVALID',
        severity: 'ERROR',
        blocking: true,
        message: 'skills.lock.json is not valid JSON.',
        remediation: 'Regenerate skills lock and retry policy reconciliation.',
        context: {
          path: skillsLockPath,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  if (bundles.length > 0) {
    for (const requiredSkill of requiredSkills) {
      if (!hasRequiredSkillInLock({ requiredSkill, bundles })) {
        addDrift(drifts, {
          code: 'AGENTS_REQUIRED_SKILL_MISSING_IN_LOCK',
          severity: 'ERROR',
          blocking: true,
          message: `Required skill "${requiredSkill}" is not mapped in skills.lock.json bundles.`,
          remediation: 'Recompile skills lock and ensure required skill source is included.',
          context: {
            required_skill: requiredSkill,
            lock_path: skillsLockPath,
          },
        });
      }
    }
  }

  const snapshot = readLifecyclePolicyValidationSnapshot(repoRoot);
  const stageHashes = new Set<string>();
  for (const [stage, stageSnapshot] of Object.entries(snapshot.stages)) {
    stageHashes.add(stageSnapshot.hash);
    const validationStatus = stageSnapshot.validationStatus;
    const validationCode = stageSnapshot.validationCode;
    if (validationStatus !== 'valid' || validationCode !== 'POLICY_AS_CODE_VALID') {
      addDrift(drifts, {
        code: 'POLICY_STAGE_INVALID',
        severity: 'ERROR',
        blocking: true,
        message: `Stage ${stage} policy is not valid (${validationCode ?? 'UNKNOWN'}).`,
        remediation: 'Fix policy-as-code contract and rerun reconciliation.',
        context: {
          stage,
          validation_status: validationStatus,
          validation_code: validationCode,
          source: stageSnapshot.source,
          hash: stageSnapshot.hash,
        },
      });
    }
    if (!stageSnapshot.strict) {
      addDrift(drifts, {
        code: 'POLICY_STAGE_NON_STRICT',
        severity: strictRequested ? 'ERROR' : 'WARN',
        blocking: strictRequested,
        message: strictRequested
          ? `Stage ${stage} runs with strict=false under strict reconcile mode.`
          : `Stage ${stage} runs with strict=false.`,
        remediation: strictRequested
          ? 'Enable strict mode (PUMUKI_POLICY_STRICT=1) and rerun reconciliation.'
          : 'Enable strict mode for enterprise fail-closed behavior.',
        context: {
          stage,
          hash: stageSnapshot.hash,
        },
      });
    }
    if (
      strictRequested &&
      (typeof stageSnapshot.policySource !== 'string' ||
        !stageSnapshot.policySource.startsWith('file:'))
    ) {
      addDrift(drifts, {
        code: 'POLICY_STAGE_UNSIGNED_OR_COMPUTED',
        severity: 'ERROR',
        blocking: true,
        message: `Stage ${stage} is not backed by a file-based policy-as-code contract.`,
        remediation:
          'Provide .pumuki/policy-as-code.json with valid signatures and rerun strict reconcile.',
        context: {
          stage,
          policy_source: stageSnapshot.policySource,
          validation_code: stageSnapshot.validationCode,
        },
      });
    }
    if (
      strictRequested &&
      (typeof stageSnapshot.signature !== 'string' || stageSnapshot.signature.trim().length === 0)
    ) {
      addDrift(drifts, {
        code: 'POLICY_STAGE_SIGNATURE_MISSING',
        severity: 'ERROR',
        blocking: true,
        message: `Stage ${stage} policy signature is missing.`,
        remediation:
          'Regenerate signed policy-as-code contract and rerun strict reconcile.',
        context: {
          stage,
          policy_source: stageSnapshot.policySource,
        },
      });
    }
  }

  if (stageHashes.size > 1) {
    addDrift(drifts, {
      code: 'POLICY_HASH_DIVERGENCE',
      severity: 'WARN',
      blocking: false,
      message: 'Policy hashes differ across PRE_COMMIT/PRE_PUSH/CI stages.',
      remediation: 'Align stage policy bundles to reduce contract drift.',
      context: {
        hashes: [...stageHashes],
      },
    });
  }

  const blocking = drifts.filter((drift) => drift.blocking).length;
  const errors = drifts.filter((drift) => drift.severity === 'ERROR').length;
  const warnings = drifts.filter((drift) => drift.severity === 'WARN').length;
  const infos = drifts.filter((drift) => drift.severity === 'INFO').length;

  const baseReport: Omit<PolicyReconcileReport, 'applyRequested' | 'autofix'> = {
    command: 'pumuki policy reconcile',
    repoRoot,
    generatedAt: now().toISOString(),
    strictRequested,
    summary: {
      total: drifts.length,
      blocking,
      errors,
      warnings,
      infos,
      status: blocking > 0 ? 'BLOCKED' : 'PASS',
    },
    requiredSkills,
    stages: snapshot.stages,
    drifts,
  };
  if (!applyRequested) {
    return {
      ...baseReport,
      applyRequested: false,
      autofix: {
        attempted: false,
        status: 'SKIPPED',
        actions: [],
        details: 'Autofix not requested.',
      },
    };
  }

  const autofix = tryApplyPolicyAutofix({
    report: baseReport,
  });

  if (autofix.status !== 'APPLIED') {
    return {
      ...baseReport,
      applyRequested: true,
      autofix,
    };
  }

  const reevaluated = runPolicyReconcile({
    repoRoot,
    now,
    strict: strictRequested,
    apply: false,
  });
  return {
    ...reevaluated,
    applyRequested: true,
    autofix,
  };
  } finally {
    if (strictRequested) {
      if (typeof strictEnvPrevious === 'string') {
        process.env.PUMUKI_POLICY_STRICT = strictEnvPrevious;
      } else {
        delete process.env.PUMUKI_POLICY_STRICT;
      }
    }
  }
};
