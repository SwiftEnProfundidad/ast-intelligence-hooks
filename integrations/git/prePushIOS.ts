import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../../core/gate/Finding';
import { evaluateGate } from '../../core/gate/evaluateGate';
import { iosEnterpriseRuleSet } from '../../core/rules/presets/iosEnterpriseRuleSet';
import { buildEvidence } from '../evidence/buildEvidence';
import type { AiEvidenceV2_1 } from '../evidence/schema';
import { writeEvidence } from '../evidence/writeEvidence';
import { policyForPrePush } from '../gate/stagePolicies';
import { evaluateStagedIOS } from './evaluateStagedIOS';

const EVIDENCE_FILE_NAME = '.ai_evidence.json';

const formatFinding = (finding: Finding): string => {
  return `${finding.ruleId}: ${finding.message}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isAiEvidenceV2_1 = (value: unknown): value is AiEvidenceV2_1 => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.version === '2.1' &&
    'snapshot' in value &&
    isRecord(value.snapshot) &&
    Array.isArray(value.ledger)
  );
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

const resolveRepoRoot = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return process.cwd();
  }
};

const loadPreviousEvidence = (repoRoot: string): AiEvidenceV2_1 | undefined => {
  try {
    const evidencePath = join(repoRoot, EVIDENCE_FILE_NAME);
    if (!existsSync(evidencePath)) {
      return undefined;
    }
    const raw: unknown = JSON.parse(readFileSync(evidencePath, 'utf8'));
    if (!isAiEvidenceV2_1(raw)) {
      return undefined;
    }
    return raw;
  } catch {
    return undefined;
  }
};

export async function runPrePushIOS(): Promise<number> {
  const policy = policyForPrePush();
  const { findings } = evaluateStagedIOS({
    stage: policy.stage,
    policy,
  });
  const decision = evaluateGate(findings, policy);

  const evidence = buildEvidence({
    stage: policy.stage,
    findings,
    previousEvidence: loadPreviousEvidence(resolveRepoRoot()),
    detectedPlatforms: {
      ios: {
        detected: true,
        confidence: 'HIGH',
      },
    },
    loadedRulesets: [
      {
        platform: 'ios',
        bundle: 'iosEnterpriseRuleSet',
        hash: createHash('sha256')
          .update(stableStringify(iosEnterpriseRuleSet))
          .digest('hex'),
      },
    ],
  });
  writeEvidence(evidence);

  if (decision.outcome === 'BLOCK') {
    for (const finding of findings) {
      console.log(formatFinding(finding));
    }
    return 1;
  }
  return 0;
}
