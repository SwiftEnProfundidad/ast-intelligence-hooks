import type { Severity } from '../../core/rules/Severity';
import type {
  SkillsCompiledRule,
  SkillsRuleConfidence,
  SkillsRuleEvaluationMode,
  SkillsRuleOrigin,
  SkillsStage,
} from './skillsLock';

const CHECK_RULE_PREFIX = /^[✅❌]\s*/u;
const BULLET_RULE_PREFIX = /^[-*]\s+/u;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const INLINE_CODE_PATTERN = /`([^`]+)`/g;
const MARKDOWN_BOLD_PATTERN = /[*_]{1,3}/g;
const MULTISPACE_PATTERN = /\s+/g;
const RULE_KEYWORDS =
  /\b(always|siempre|prefer|use|usar|avoid|evitar|never|nunca|must|obligatorio|required|disallow|do not|no)\b/i;

const normalizeForLookup = (value: string): string => {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const slugify = (value: string): string => {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

const sanitizeRuleDescription = (value: string): string => {
  return value
    .replace(CHECK_RULE_PREFIX, '')
    .replace(BULLET_RULE_PREFIX, '')
    .replace(MARKDOWN_LINK_PATTERN, '$1')
    .replace(INLINE_CODE_PATTERN, '$1')
    .replace(MARKDOWN_BOLD_PATTERN, '')
    .replace(MULTISPACE_PATTERN, ' ')
    .trim();
};

const inferRuleSeverity = (raw: string): Severity => {
  const normalized = normalizeForLookup(raw);
  if (/^\s*❌/u.test(raw)) {
    return 'ERROR';
  }
  if (/\bcritical\b|\bbloqueante\b|\bblock\b/.test(normalized)) {
    return 'CRITICAL';
  }
  if (
    /\bnever\b|\bnunca\b|\bmust\b|\bobligatorio\b|\brequired\b|\bdisallow\b|\bavoid\b|\bevitar\b|\bdo not\b/.test(
      normalized
    )
  ) {
    return 'ERROR';
  }
  return 'WARN';
};

const inferRuleConfidence = (raw: string): SkillsRuleConfidence => {
  if (/^\s*❌/u.test(raw)) {
    return 'HIGH';
  }
  if (/\bmust\b|\bobligatorio\b|\brequired\b|\bdisallow\b/i.test(raw)) {
    return 'HIGH';
  }
  return 'MEDIUM';
};

const inferRuleStage = (raw: string): SkillsStage | undefined => {
  const normalized = normalizeForLookup(raw);
  if (/\bpre push\b/.test(normalized)) {
    return 'PRE_PUSH';
  }
  if (/\bpre commit\b/.test(normalized)) {
    return 'PRE_COMMIT';
  }
  if (/\bci\b/.test(normalized)) {
    return 'CI';
  }
  return undefined;
};

const isRuleCandidateLine = (line: string): boolean => {
  if (CHECK_RULE_PREFIX.test(line)) {
    return true;
  }
  if (!BULLET_RULE_PREFIX.test(line)) {
    return false;
  }
  const content = line.replace(BULLET_RULE_PREFIX, '').trim();
  if (content.length < 8) {
    return false;
  }
  if (/^\[[ xX]\]\s+/.test(content)) {
    return false;
  }
  if (/^\|/.test(content)) {
    return false;
  }
  return RULE_KEYWORDS.test(content);
};

const extractRuleCandidateLines = (markdown: string): string[] => {
  const lines = markdown.split('\n');
  const candidates: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    if (trimmed.length === 0 || trimmed.startsWith('#') || trimmed.startsWith('|')) {
      continue;
    }
    if (!isRuleCandidateLine(trimmed)) {
      continue;
    }
    candidates.push(trimmed);
  }

  return candidates;
};

const resolvePlatformFromBundle = (
  bundleName: string
): SkillsCompiledRule['platform'] => {
  const normalized = bundleName.toLowerCase();
  if (normalized.includes('ios')) {
    return 'ios';
  }
  if (normalized.includes('android')) {
    return 'android';
  }
  if (normalized.includes('backend')) {
    return 'backend';
  }
  if (normalized.includes('frontend')) {
    return 'frontend';
  }
  return 'generic';
};

const normalizeKnownRuleTarget = (
  platform: SkillsCompiledRule['platform'],
  normalizedDescription: string
): string | null => {
  const includes = (needle: string): boolean => normalizedDescription.includes(needle);

  if (platform === 'ios') {
    if (includes('force unwrap')) {
      return 'skills.ios.no-force-unwrap';
    }
    if (includes('force try')) {
      return 'skills.ios.no-force-try';
    }
    if (includes('anyview')) {
      return 'skills.ios.no-anyview';
    }
    if (includes('callback style') || includes('completion handler')) {
      return 'skills.ios.no-callback-style-outside-bridges';
    }
    if (includes('force cast')) {
      return 'skills.ios.no-force-cast';
    }
    if (includes('dispatchqueue') || includes('dispatch queue')) {
      return 'skills.ios.no-dispatchqueue';
    }
    if (includes('dispatchgroup') || includes('dispatch group')) {
      return 'skills.ios.no-dispatchgroup';
    }
    if (includes('dispatchsemaphore') || includes('dispatch semaphore')) {
      return 'skills.ios.no-dispatchsemaphore';
    }
    if (includes('operationqueue') || includes('operation queue')) {
      return 'skills.ios.no-operation-queue';
    }
    if (includes('task detached') || includes('task.detached')) {
      return 'skills.ios.no-task-detached';
    }
    if (includes('unchecked sendable')) {
      return 'skills.ios.no-unchecked-sendable';
    }
    if (includes('observableobject') || includes('observable object')) {
      return 'skills.ios.no-observable-object';
    }
    if (includes('navigationview') || includes('navigation view')) {
      return 'skills.ios.no-navigation-view';
    }
    if (includes('ontapgesture') || includes('on tap gesture')) {
      return 'skills.ios.no-on-tap-gesture';
    }
    if (includes('string format') || includes('string(format')) {
      return 'skills.ios.no-string-format';
    }
    if (includes('uiscreen main bounds') || includes('uiscreen.main.bounds')) {
      return 'skills.ios.no-uiscreen-main-bounds';
    }
    return null;
  }

  if (platform === 'android') {
    if (includes('thread sleep') || includes('thread.sleep')) {
      return 'skills.android.no-thread-sleep';
    }
    if (includes('globalscope') || includes('global scope')) {
      return 'skills.android.no-globalscope';
    }
    if (includes('runblocking') || includes('run blocking')) {
      return 'skills.android.no-runblocking';
    }
    return null;
  }

  if (platform === 'backend' || platform === 'frontend') {
    const prefix = platform === 'backend' ? 'skills.backend' : 'skills.frontend';
    if (includes('solid') || includes('single responsibility') || includes('srp')) {
      return `${prefix}.no-solid-violations`;
    }
    if (includes('clean architecture')) {
      return `${prefix}.enforce-clean-architecture`;
    }
    if (
      includes('god classes') ||
      includes('god class') ||
      includes('500 lineas') ||
      includes('500 li neas') ||
      includes('500 lines')
    ) {
      return `${prefix}.no-god-classes`;
    }
    if (includes('empty catch')) {
      return `${prefix}.no-empty-catch`;
    }
    if (includes('console log') || includes('console.log')) {
      return `${prefix}.no-console-log`;
    }
    if (includes('explicit any') || includes(' no any') || includes('avoid any')) {
      return `${prefix}.avoid-explicit-any`;
    }
    return null;
  }

  return null;
};

const buildGeneratedRuleId = (
  params: {
    platform: SkillsCompiledRule['platform'];
    sourceSkill: string;
    description: string;
  },
  usedIds: Set<string>
): string => {
  const slug = slugify(params.description).slice(0, 70) || 'rule';
  const sourceSlug = slugify(params.sourceSkill).replace(/-guidelines?$/, '') || 'bundle';
  const base = `skills.${params.platform}.guideline.${sourceSlug}.${slug}`;
  if (!usedIds.has(base)) {
    return base;
  }
  let counter = 2;
  while (usedIds.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
};

const dedupeById = (
  rules: ReadonlyArray<SkillsCompiledRule>
): SkillsCompiledRule[] => {
  const byId = new Map<string, SkillsCompiledRule>();
  for (const rule of rules) {
    byId.set(rule.id, rule);
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
};

export const extractCompiledRulesFromSkillMarkdown = (params: {
  sourceSkill: string;
  sourcePath: string;
  sourceContent: string;
  existingRuleIds?: ReadonlyArray<string>;
  origin?: SkillsRuleOrigin;
}): SkillsCompiledRule[] => {
  const platform = resolvePlatformFromBundle(params.sourceSkill);
  const usedIds = new Set<string>(params.existingRuleIds ?? []);
  const rules: SkillsCompiledRule[] = [];

  for (const rawLine of extractRuleCandidateLines(params.sourceContent)) {
    const description = sanitizeRuleDescription(rawLine);
    if (description.length < 6) {
      continue;
    }

    const knownRuleId = normalizeKnownRuleTarget(platform, normalizeForLookup(description));
    let nextId: string;
    if (knownRuleId) {
      if (usedIds.has(knownRuleId)) {
        continue;
      }
      nextId = knownRuleId;
    } else {
      nextId = buildGeneratedRuleId(
        {
          platform,
          sourceSkill: params.sourceSkill,
          description,
        },
        usedIds
      );
    }

    if (usedIds.has(nextId)) {
      continue;
    }
    usedIds.add(nextId);

    const evaluationMode: SkillsRuleEvaluationMode = 'AUTO';

    rules.push({
      id: nextId,
      description,
      severity: inferRuleSeverity(rawLine),
      platform,
      sourceSkill: params.sourceSkill,
      sourcePath: params.sourcePath,
      stage: inferRuleStage(rawLine),
      confidence: inferRuleConfidence(rawLine),
      locked: true,
      evaluationMode,
      origin: params.origin ?? 'core',
    });
  }

  return dedupeById(rules);
};
