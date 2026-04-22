import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SkillsStage } from '../config/skillsLock';
import type { PolicyProfileSource } from './policyProfiles';

const POLICY_AS_CODE_CONTRACT_PATH = '.pumuki/policy-as-code.json';
const POLICY_AS_CODE_VERSION = '1.0';

export type PolicyAsCodeValidation = {
  status: 'valid' | 'invalid' | 'expired' | 'unknown-source' | 'unsigned';
  code:
    | 'POLICY_AS_CODE_VALID'
    | 'POLICY_AS_CODE_UNSIGNED'
    | 'POLICY_AS_CODE_CONTRACT_INVALID'
    | 'POLICY_AS_CODE_CONTRACT_EXPIRED'
    | 'POLICY_AS_CODE_SIGNATURE_MISMATCH'
    | 'POLICY_AS_CODE_UNKNOWN_SOURCE';
  message: string;
  strict: boolean;
};

export type PolicyAsCodeTraceMetadata = {
  version: string;
  signature: string;
  policySource: string;
  validation: PolicyAsCodeValidation;
};

type PolicyAsCodeContract = {
  version: '1.0';
  source: PolicyProfileSource;
  signatures: Record<SkillsStage, string>;
  expires_at?: string;
  strict?: Partial<Record<SkillsStage, boolean>>;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isSha256Hex = (value: unknown): value is string => {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
};

const isIsoDateString = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  return Number.isFinite(Date.parse(value));
};

const isPolicyStrictRecord = (
  value: unknown
): value is Partial<Record<SkillsStage, boolean>> => {
  if (!isObject(value)) {
    return false;
  }
  return Object.entries(value).every(([stage, strict]) => {
    return (
      (stage === 'PRE_WRITE' ||
        stage === 'PRE_COMMIT' ||
        stage === 'PRE_PUSH' ||
        stage === 'CI') &&
      typeof strict === 'boolean'
    );
  });
};

const policyStrictModeFromEnv = (): boolean => {
  const raw = process.env.PUMUKI_POLICY_STRICT?.trim().toLowerCase();
  if (!raw) {
    return false;
  }
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
};

const isPolicyAsCodeContract = (value: unknown): value is PolicyAsCodeContract => {
  if (!isObject(value)) {
    return false;
  }
  if (value.version !== '1.0') {
    return false;
  }
  if (
    value.source !== 'default' &&
    value.source !== 'skills.policy' &&
    value.source !== 'hard-mode'
  ) {
    return false;
  }
  if (!isObject(value.signatures)) {
    return false;
  }
  if (typeof value.expires_at !== 'undefined' && !isIsoDateString(value.expires_at)) {
    return false;
  }
  if (typeof value.strict !== 'undefined' && !isPolicyStrictRecord(value.strict)) {
    return false;
  }
  return (
    isSha256Hex(value.signatures.PRE_COMMIT) &&
    isSha256Hex(value.signatures.PRE_PUSH) &&
    isSha256Hex(value.signatures.CI)
  );
};

const resolvePolicyAsCodeStrict = (params: {
  contract?: PolicyAsCodeContract;
  stage: SkillsStage;
}): boolean => {
  const declared = params.contract?.strict?.[params.stage];
  if (typeof declared === 'boolean') {
    return declared;
  }
  return policyStrictModeFromEnv();
};

export const createPolicyAsCodeSignature = (params: {
  stage: SkillsStage;
  source: PolicyProfileSource;
  bundle: string;
  hash: string;
  version: string;
}): string => {
  return createHash('sha256')
    .update(
      JSON.stringify({
        stage: params.stage,
        source: params.source,
        bundle: params.bundle,
        hash: params.hash,
        version: params.version,
      })
    )
    .digest('hex');
};

export const resolvePolicyAsCodeTraceMetadata = (params: {
  stage: SkillsStage;
  source: PolicyProfileSource;
  bundle: string;
  hash: string;
  repoRoot: string;
}): PolicyAsCodeTraceMetadata => {
  const envStrict = policyStrictModeFromEnv();
  const computedVersion = `policy-as-code/${params.source}@${POLICY_AS_CODE_VERSION}`;
  const computedSignature = createPolicyAsCodeSignature({
    stage: params.stage,
    source: params.source,
    bundle: params.bundle,
    hash: params.hash,
    version: POLICY_AS_CODE_VERSION,
  });
  const contractPath = join(params.repoRoot, POLICY_AS_CODE_CONTRACT_PATH);

  if (!existsSync(contractPath)) {
    if (envStrict) {
      return {
        version: computedVersion,
        signature: computedSignature,
        policySource: 'computed-local',
        validation: {
          status: 'unsigned',
          code: 'POLICY_AS_CODE_UNSIGNED',
          message:
            'Policy-as-code contract is missing; runtime policy metadata is unsigned.',
          strict: envStrict,
        },
      };
    }

    return {
      version: computedVersion,
      signature: computedSignature,
      policySource: 'computed-local',
      validation: {
        status: 'valid',
        code: 'POLICY_AS_CODE_VALID',
        message: 'Policy-as-code metadata generated from active runtime policy.',
        strict: envStrict,
      },
    };
  }

  try {
    const raw: unknown = JSON.parse(readFileSync(contractPath, 'utf8'));
    if (!isPolicyAsCodeContract(raw)) {
      return {
        version: computedVersion,
        signature: computedSignature,
        policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
        validation: {
          status: 'invalid',
          code: 'POLICY_AS_CODE_CONTRACT_INVALID',
          message: 'Policy-as-code contract is malformed.',
          strict: envStrict,
        },
      };
    }

    const strict = resolvePolicyAsCodeStrict({
      contract: raw,
      stage: params.stage,
    });

    if (raw.source !== params.source) {
      return {
        version: `policy-as-code/${raw.source}@${raw.version}`,
        signature: raw.signatures[params.stage],
        policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
        validation: {
          status: 'unknown-source',
          code: 'POLICY_AS_CODE_UNKNOWN_SOURCE',
          message:
            `Policy-as-code contract source mismatch: expected=${params.source} actual=${raw.source}.`,
          strict,
        },
      };
    }

    const expectedSignature = createPolicyAsCodeSignature({
      stage: params.stage,
      source: params.source,
      bundle: params.bundle,
      hash: params.hash,
      version: raw.version,
    });
    const stageSignature = raw.signatures[params.stage];

    if (stageSignature !== expectedSignature) {
      return {
        version: `policy-as-code/${raw.source}@${raw.version}`,
        signature: stageSignature,
        policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
        validation: {
          status: 'invalid',
          code: 'POLICY_AS_CODE_SIGNATURE_MISMATCH',
          message:
            'Policy-as-code signature mismatch for active stage against runtime policy trace.',
          strict,
        },
      };
    }

    if (typeof raw.expires_at === 'string') {
      const expiresAtTimestamp = Date.parse(raw.expires_at);
      if (Number.isFinite(expiresAtTimestamp) && Date.now() >= expiresAtTimestamp) {
        return {
          version: `policy-as-code/${raw.source}@${raw.version}`,
          signature: stageSignature,
          policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
          validation: {
            status: 'expired',
            code: 'POLICY_AS_CODE_CONTRACT_EXPIRED',
            message: `Policy-as-code contract expired at ${raw.expires_at}.`,
            strict,
          },
        };
      }
    }

    return {
      version: `policy-as-code/${raw.source}@${raw.version}`,
      signature: stageSignature,
      policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
      validation: {
        status: 'valid',
        code: 'POLICY_AS_CODE_VALID',
        message: 'Policy-as-code contract verified successfully.',
        strict,
      },
    };
  } catch {
    return {
      version: computedVersion,
      signature: computedSignature,
      policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
      validation: {
        status: 'invalid',
        code: 'POLICY_AS_CODE_CONTRACT_INVALID',
        message: 'Policy-as-code contract cannot be parsed as JSON.',
        strict: envStrict,
      },
    };
  }
};
