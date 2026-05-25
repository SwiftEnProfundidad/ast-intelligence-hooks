import type { SkillsCompiledRule, SkillsLockV1 } from './skillsLock';
import { resolveMappedHeuristicRuleIdsForCompiledRule } from './skillsDetectorRegistry';

export type SkillsRuleClassificationStatus =
  | 'AST_IMPLEMENTED'
  | 'IMPLEMENTAR_DETECTOR'
  | 'REQUIERE_ESTUDIO'
  | 'NO_ES_REGLA_DE_CODIGO';

export type ClassifiedSkillsRule = {
  ruleId: string;
  platform: SkillsCompiledRule['platform'];
  sourceSkill: string;
  sourcePath: string;
  evaluationMode: 'AUTO' | 'DECLARATIVE';
  severity: SkillsCompiledRule['severity'];
  status: SkillsRuleClassificationStatus;
  reason: string;
  astNodeIds: ReadonlyArray<string>;
};

export type SkillsRuleClassificationSummary = {
  total: number;
  byStatus: Record<SkillsRuleClassificationStatus, number>;
  byPlatform: Record<string, number>;
  rules: ReadonlyArray<ClassifiedSkillsRule>;
};

const emptyStatusCounts = (): Record<SkillsRuleClassificationStatus, number> => ({
  AST_IMPLEMENTED: 0,
  IMPLEMENTAR_DETECTOR: 0,
  REQUIERE_ESTUDIO: 0,
  NO_ES_REGLA_DE_CODIGO: 0,
});

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const NON_CODE_RULE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bactua como\b/,
  /\bsiempre responder\b/,
  /\bflujo bdd\b/,
  /\bfeature files\b/,
  /\bspecs\b.*\bimplementacion\b/,
  /\bcomprobar que compile\b/,
  /\banalizar estructura existente\b/,
  /\bandroid profiler\b/,
  /\bxcode instruments\b/,
  /\bdocumentation\b/,
  /\bdocumentacion\b/,
  /\breadme\b/,
  /\buse grep\b/,
  /\buse references\b/,
  /\breferences\b.*\bmd\b/,
  /\bwhen to use\b/,
  /\bci\/cd\b/,
  /\bgithub actions?\b/,
  /\bgitlab ci\b/,
  /\bpipelines?\b/,
  /\baaa pattern\b/,
  /\barrange\b.*\bact\b.*\bassert\b/,
  /\binstrumented tests?\b/,
  /\bdevice emulator\b/,
  /\bbaseline profiles?\b/,
  /\boptimizacion de startup\b/,
  /\bcoverage\b/,
  /\bfast tests?\b/,
  /\bunitarios\b/,
  /\binstruments\b/,
  /\btime profiler\b/,
  /\ballocations\b/,
  /\bleakcanary\b/,
  /\btestflight\b/,
  /\bfastlane\b/,
  /\bdeployments?\b/,
  /\bxcode\b.*\bversion\b/,
  /\bxcodebuild\b/,
  /\bvoiceover\b.*\b(test|screen reader)\b/,
  /\bmeasure[-\s]twice\b/,
  /\bspm[-\s]swift[-\s]package[-\s]manager\b/,
  /\blocal[-\s]packages?\b/,
  /\bfeature[-\s]modules?.*\bpackages?\b/,
  /\bun[-\s]target\b.*\bplataforma\b/,
  /\btestability\b.*\bpackage\b.*\btests?\b/,
];

const CODE_RULE_WITH_DIRECT_DETECTOR_PATTERNS: ReadonlyArray<RegExp> = [
  /\baccessibility\b/,
  /\bcontentdescription\b/,
  /\bsemantic\b/,
  /\btest tag\b/,
  /\basynctask\b/,
  /\bcallback\b/,
  /\bglobal ?scope\b/,
  /\brunblocking\b/,
  /\bthread\.?sleep\b/,
  /\bdispatch(queue|group|semaphore)\b/,
  /\bforce\b.*\b(unwrap|try|cast)\b/,
  /\btry!\b/,
  /\bas!\b/,
  /\bany\b/,
  /\bconsole\b/,
  /\blog\b/,
  /\bprint\b/,
  /\bsecret\b/,
  /\btoken\b/,
  /\bpassword\b/,
  /\bapi key\b/,
  /\bhardcoded\b/,
  /\bmagic number\b/,
  /\bcolor\b/,
  /\bdimension\b/,
  /\bgod\b/,
  /\blarge\b.*\b(class|component|view|service|function|file)\b/,
  /\bsolid\b/,
  /\bsrp\b/,
  /\bdependency\b.*\binjection\b/,
  /\bconstructor\b.*\b(param|dependency)/,
  /\bsharedpreferences\b/,
  /\buserdefaults\b/,
  /\bappstorage\b/,
  /\bkeychain\b/,
  /\braw sql\b/,
  /\bsql\b.*\b(template|injection)\b/,
  /\bempty catch\b/,
  /\bcatch\b.*\b(empty|silenc)/,
  /\bmock\b/,
  /\bspy\b/,
  /\bjunit4\b/,
  /\bxctassert\b/,
  /\bxctunwrap\b/,
  /\bxctest\b/,
  /\bquick\b/,
  /\bnimble\b/,
  /\bwaitforexpectations\b/,
  /\bexpectation\(description\b/,
  /\bnavigationview\b/,
  /\bgeometryreader\b/,
  /\banyview\b/,
  /\bforegroundcolor\b/,
  /\bcornerradius\b/,
  /\bsheet\b.*\bispresented\b/,
  /\bscrollview\b.*\bshowsindicators\b/,
  /\bforeach\b.*\b(indices|index)\b/,
  /\bonchange\b/,
  /\bontapgesture\b/,
  /\buiscreen\.main\.bounds\b/,
  /\bstring\(format\b/,
  /\bobservableobject\b/,
  /\bstateobject\b/,
  /\bobservable\b/,
  /\blivedata\b/,
  /\bstateflow\b/,
  /\bsharedflow\b/,
  /\bremember\b/,
  /\blaunched(effect)?\b/,
  /\blazy(column|row|vstack|hstack)\b/,
  /\bwindow ?size ?class\b/,
  /\bpadding\b/,
  /\bframe\b/,
  /\bfont\b/,
  /\broute\b/,
  /\bnavigation\b/,
];

const STUDY_BEFORE_DETECTOR_RULE_IDS = new Set<string>([
  'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass',
  'skills.android.guideline.android.color-contrast-wcag-aa-mi-nimo',
  'skills.android.guideline.android.play-console-production-deployment',
]);

const requiresStudyBeforeDetector = (rule: SkillsCompiledRule): boolean =>
  STUDY_BEFORE_DETECTOR_RULE_IDS.has(rule.id);

const isNonCodeRule = (rule: SkillsCompiledRule): boolean => {
  const haystack = normalizeText(`${rule.id} ${rule.description} ${rule.sourceSkill}`);
  return NON_CODE_RULE_PATTERNS.some((pattern) => pattern.test(haystack));
};

const hasDirectCodeDetectorCandidate = (rule: SkillsCompiledRule): boolean => {
  const haystack = normalizeText(`${rule.id} ${rule.description} ${rule.sourceSkill}`);
  return CODE_RULE_WITH_DIRECT_DETECTOR_PATTERNS.some((pattern) => pattern.test(haystack));
};

const classifyRule = (rule: SkillsCompiledRule): ClassifiedSkillsRule => {
  const evaluationMode = rule.evaluationMode ?? 'AUTO';
  const astNodeIds = resolveMappedHeuristicRuleIdsForCompiledRule(rule);

  if (astNodeIds.length > 0) {
    return {
      ruleId: rule.id,
      platform: rule.platform,
      sourceSkill: rule.sourceSkill,
      sourcePath: rule.sourcePath,
      evaluationMode,
      severity: rule.severity,
      status: 'AST_IMPLEMENTED',
      reason: `Mapped to AST/nodal detector(s): ${astNodeIds.join(', ')}`,
      astNodeIds,
    };
  }

  if (evaluationMode === 'AUTO') {
    return {
      ruleId: rule.id,
      platform: rule.platform,
      sourceSkill: rule.sourceSkill,
      sourcePath: rule.sourcePath,
      evaluationMode,
      severity: rule.severity,
      status: 'IMPLEMENTAR_DETECTOR',
      reason: 'AUTO rule without AST/nodal detector binding; implement detector mapping.',
      astNodeIds,
    };
  }

  if (requiresStudyBeforeDetector(rule)) {
    return {
      ruleId: rule.id,
      platform: rule.platform,
      sourceSkill: rule.sourceSkill,
      sourcePath: rule.sourcePath,
      evaluationMode,
      severity: rule.severity,
      status: 'REQUIERE_ESTUDIO',
      reason:
        'Rule has code relevance, but the AST/nodal signal needs explicit design before implementation to avoid poor umbrella detectors.',
      astNodeIds,
    };
  }

  if (isNonCodeRule(rule)) {
    return {
      ruleId: rule.id,
      platform: rule.platform,
      sourceSkill: rule.sourceSkill,
      sourcePath: rule.sourcePath,
      evaluationMode,
      severity: rule.severity,
      status: 'NO_ES_REGLA_DE_CODIGO',
      reason: 'Process, documentation, validation workflow, or operating rule; keep outside code AST runtime.',
      astNodeIds,
    };
  }

  if (hasDirectCodeDetectorCandidate(rule)) {
    return {
      ruleId: rule.id,
      platform: rule.platform,
      sourceSkill: rule.sourceSkill,
      sourcePath: rule.sourcePath,
      evaluationMode,
      severity: rule.severity,
      status: 'IMPLEMENTAR_DETECTOR',
      reason: 'Code rule has a direct AST/nodal detection surface; implement detector and blocking evidence.',
      astNodeIds,
    };
  }

  return {
    ruleId: rule.id,
    platform: rule.platform,
    sourceSkill: rule.sourceSkill,
    sourcePath: rule.sourcePath,
    evaluationMode,
    severity: rule.severity,
    status: 'REQUIERE_ESTUDIO',
    reason: 'Declarative skill rule without AST/nodal detector. Study exact code pattern, AST node, and closure criterion.',
    astNodeIds,
  };
};

export const classifySkillsRules = (
  lock: SkillsLockV1
): SkillsRuleClassificationSummary => {
  const rules = lock.bundles
    .flatMap((bundle) => bundle.rules)
    .filter((rule) => rule.id.startsWith('skills.'))
    .map(classifyRule)
    .sort((left, right) => left.ruleId.localeCompare(right.ruleId));

  const byStatus = emptyStatusCounts();
  const byPlatform: Record<string, number> = {};

  for (const rule of rules) {
    byStatus[rule.status] += 1;
    byPlatform[rule.platform] = (byPlatform[rule.platform] ?? 0) + 1;
  }

  return {
    total: rules.length,
    byStatus,
    byPlatform: Object.fromEntries(
      Object.entries(byPlatform).sort(([left], [right]) => left.localeCompare(right))
    ),
    rules,
  };
};
