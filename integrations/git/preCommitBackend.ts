import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Fact } from '../../core/facts/Fact';
import type { FileChangeFact } from '../../core/facts/FileChangeFact';
import type { FileContentFact } from '../../core/facts/FileContentFact';
import type { Finding } from '../../core/gate/Finding';
import { evaluateGate } from '../../core/gate/evaluateGate';
import { evaluateRules } from '../../core/gate/evaluateRules';
import type { RuleSet } from '../../core/rules/RuleSet';
import { mergeRuleSets } from '../../core/rules/mergeRuleSets';
import { loadProjectRules } from '../config/loadProjectRules';
import { buildEvidence } from '../evidence/buildEvidence';
import type { AiEvidenceV2_1 } from '../evidence/schema';
import { writeEvidence } from '../evidence/writeEvidence';
import { policyForPreCommit } from '../gate/stagePolicies';
import { detectBackendFromFacts } from '../platform/detectBackend';

type ChangeFact = FileChangeFact & { source: string };
type ContentFact = FileContentFact & { source: string };

type StagedChange = {
  path: string;
  changeType: 'added' | 'modified' | 'deleted';
};

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

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' });
};

const resolveRepoRoot = (): string => {
  try {
    return runGit(['rev-parse', '--show-toplevel']).trim();
  } catch {
    return process.cwd();
  }
};

const parseNameStatus = (output: string): StagedChange[] => {
  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  const changes: StagedChange[] = [];
  for (const line of trimmed.split('\n')) {
    if (!line) {
      continue;
    }
    const parts = line.split('\t');
    const status = parts[0];
    const statusCode = status[0];
    const path = statusCode === 'R' || statusCode === 'C' ? parts[2] : parts[1];
    if (!path) {
      continue;
    }

    const changeType =
      statusCode === 'A'
        ? 'added'
        : statusCode === 'M'
          ? 'modified'
          : statusCode === 'D'
            ? 'deleted'
            : statusCode === 'R' || statusCode === 'C'
              ? 'modified'
              : null;
    if (!changeType) {
      continue;
    }
    changes.push({ path, changeType });
  }

  return changes;
};

const isBackendTypeScriptPath = (path: string): boolean => {
  return path.startsWith('apps/backend/') && path.endsWith('.ts');
};

const createFacts = (changes: ReadonlyArray<StagedChange>): ReadonlyArray<Fact> => {
  const facts: Fact[] = [];
  const source = 'git:staged';

  for (const change of changes) {
    const changeFact: ChangeFact = {
      kind: 'FileChange',
      path: change.path,
      changeType: change.changeType,
      source,
    };
    facts.push(changeFact);

    if (change.changeType === 'deleted') {
      continue;
    }

    const content = runGit(['show', `:${change.path}`]);
    const contentFact: ContentFact = {
      kind: 'FileContent',
      path: change.path,
      content,
      source,
    };
    facts.push(contentFact);
  }

  return facts;
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

const emptyRuleSet: RuleSet = [];

const resolveRulesetFile = (
  fileName: 'rulesgold.mdc' | 'rulesbackend.mdc'
): string | undefined => {
  const candidates = [
    join(process.cwd(), 'legacy', 'tooling', '.cursor', 'rules', fileName),
    join(process.cwd(), 'legacy', 'tooling', '.windsurf', 'rules', fileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const hashRulesetFile = (filePath: string | undefined): string => {
  if (!filePath) {
    return 'missing';
  }
  return createHash('sha256').update(readFileSync(filePath, 'utf8')).digest('hex');
};

export async function runPreCommitBackend(): Promise<number> {
  const policy = policyForPreCommit();
  const nameStatus = runGit(['diff', '--cached', '--name-status']);
  const changes = parseNameStatus(nameStatus).filter((change) =>
    isBackendTypeScriptPath(change.path)
  );

  const facts = createFacts(changes);
  const projectConfig = loadProjectRules();
  const projectRules = projectConfig?.rules ?? [];
  const baselineRules = mergeRuleSets(emptyRuleSet, emptyRuleSet);
  const mergedRules = mergeRuleSets(baselineRules, projectRules, {
    allowDowngradeBaseline: projectConfig?.allowOverrideLocked === true,
  });

  const findings = evaluateRules(mergedRules, facts);
  const decision = evaluateGate([...findings], policy);

  const backendPlatform = detectBackendFromFacts(facts);
  const goldRulesetFile = resolveRulesetFile('rulesgold.mdc');
  const backendRulesetFile = resolveRulesetFile('rulesbackend.mdc');
  const evidence = buildEvidence({
    stage: policy.stage,
    findings,
    previousEvidence: loadPreviousEvidence(resolveRepoRoot()),
    detectedPlatforms: {
      backend: backendPlatform,
    },
    loadedRulesets: [
      {
        platform: 'gold',
        bundle: 'rulesgold.mdc',
        hash: hashRulesetFile(goldRulesetFile),
      },
      {
        platform: 'backend',
        bundle: 'rulesbackend.mdc',
        hash: hashRulesetFile(backendRulesetFile),
      },
      {
        platform: 'backend',
        bundle: 'project-rules',
        hash: createHash('sha256')
          .update(stableStringify(projectRules))
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
