import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { RuleDefinition } from '../../../core/rules/RuleDefinition';
import type { RuleSet } from '../../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import type { DetectedPlatforms } from '../../platform/detectPlatforms';
import { androidRuleSet } from '../../../core/rules/presets/androidRuleSet';
import { iosEnterpriseRuleSet } from '../../../core/rules/presets/iosEnterpriseRuleSet';
import {
  evaluatePlatformGateFindings,
  type PlatformGateEvaluationDependencies,
} from '../runPlatformGateEvaluation';
import { withTempDir } from '../../__tests__/helpers/tempDir';

const makeRule = (id: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'WARN'): RuleDefinition => {
  return {
    id,
    description: id,
    severity,
    when: { kind: 'FileChange' },
    then: { kind: 'Finding', message: id, code: id.toUpperCase() },
    platform: 'backend',
  };
};

test('evaluatePlatformGateFindings bloquea OCP iOS SOLID en PRE_WRITE sin flag experimental de heuristicas', async () => {
  await withTempDir('pumuki-ios-solid-prewrite-gate-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'apps/ios/Presentation/Onboarding'), { recursive: true });
    const lock = {
      version: '1.0',
      compilerVersion: '1.0.0',
      generatedAt: '2026-05-05T00:00:00.000Z',
      bundles: [
        {
          name: 'ios-guidelines',
          version: '1.0.0',
          source: 'file:vendor/skills/ios-enterprise-rules/SKILL.md',
          hash: 'd'.repeat(64),
          rules: [
            {
              id: 'skills.ios.no-solid-violations',
              description: 'Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
              severity: 'WARN',
              platform: 'ios',
              confidence: 'MEDIUM',
              sourceSkill: 'ios-guidelines',
              sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
              stage: 'PRE_WRITE',
              evaluationMode: 'AUTO',
              locked: true,
            },
          ],
        },
      ],
    } as const;
    writeFileSync(join(repoRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

    const result = evaluatePlatformGateFindings(
      {
        repoRoot,
        stage: 'PRE_WRITE',
        facts: [
          {
            kind: 'FileContent',
            path: 'apps/ios/Presentation/Onboarding/LaunchFlowCoordinator.swift',
            source: 'test',
            content: `enum PumukiOcpIosCanaryChannel {
  case groceryPickup
  case homeDelivery
}

final class PumukiOcpIosCanaryUseCase {
  func makeBanner(for channel: PumukiOcpIosCanaryChannel) -> String {
    switch channel {
    case .groceryPickup:
      return "pickup"
    case .homeDelivery:
      return "delivery"
    }
  }
}
`,
          },
        ],
      },
      {
        loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      }
    );

    assert.ok(result.skillsRuleSet.requiresHeuristicFacts);
    assert.ok(
      result.findings.some(
        (finding) =>
          finding.ruleId === 'skills.ios.no-solid-violations' &&
          finding.filePath === 'apps/ios/Presentation/Onboarding/LaunchFlowCoordinator.swift' &&
          finding.severity === 'ERROR'
      )
    );
    assert.ok(
      result.coverage.matchedRuleIds.includes('ios.solid.ocp.discriminator-switch-branching')
    );
  });
});

test('evaluatePlatformGateFindings normaliza stage STAGED y eleva scope TS a all cuando skills lo requiere fuera de apps/*', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'test',
    },
  ];
  const heuristicFacts: ReadonlyArray<Fact> = [
    {
      kind: 'Heuristic',
      ruleId: 'heuristic.test',
      severity: 'WARN',
      code: 'HEURISTIC_TEST',
      message: 'heuristic fact',
      filePath: 'src/a.ts',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const baselineRule = makeRule('baseline.rule');
  const skillsRule = makeRule('skills.rule');
  const mergedRule = makeRule('merged.rule');
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'merged.rule',
      severity: 'WARN',
      code: 'MERGED_RULE',
      message: 'finding',
      filePath: 'src/a.ts',
    },
  ];
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [skillsRule],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
  };

  let capturedSkillsStage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | undefined;
  let capturedSkillsRepoRoot: string | undefined;
  let capturedExtractHeuristicFactsInput:
    | {
      facts: ReadonlyArray<Fact>;
      detectedPlatforms: DetectedPlatforms;
    }
    | undefined;
  let capturedMergeRuleSetsInput:
    | {
      baselineRules: RuleSet;
      projectRules: RuleSet;
      options?: { allowDowngradeBaseline?: boolean };
    }
    | undefined;
  let capturedEvaluateRulesInput:
    | {
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;
  let capturedTraceabilityInput:
    | {
      findings: ReadonlyArray<Finding>;
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
    loadSkillsRuleSetForStage: (stage, repoRoot) => {
      capturedSkillsStage = stage;
      capturedSkillsRepoRoot = repoRoot;
      return skillsRuleSet;
    },
    buildCombinedBaselineRules: () => [baselineRule],
    extractHeuristicFacts: (input) => {
      capturedExtractHeuristicFactsInput = input;
      return heuristicFacts;
    },
    applyHeuristicSeverityForStage: () => {
      throw new Error('No debe invocarse cuando astSemanticEnabled=false');
    },
    loadProjectRules: () => undefined,
    mergeRuleSets: (baselineRules, projectRules, options) => {
      capturedMergeRuleSetsInput = { baselineRules, projectRules, options };
      return [mergedRule];
    },
    evaluateRules: (rules, factsArg) => {
      capturedEvaluateRulesInput = { rules, facts: factsArg };
      return findings;
    },
    attachFindingTraceability: (input) => {
      capturedTraceabilityInput = input;
      return input.findings;
    },
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'STAGED',
      repoRoot: '/repo',
    },
    deps
  );

  assert.equal(capturedSkillsStage, 'PRE_COMMIT');
  assert.equal(capturedSkillsRepoRoot, '/repo');
  assert.deepEqual(capturedExtractHeuristicFactsInput, {
    facts: inputFacts,
    detectedPlatforms,
    typeScriptScope: 'all',
  });
  assert.deepEqual(
    capturedMergeRuleSetsInput?.baselineRules.map((rule) => rule.id),
    ['baseline.rule', 'skills.rule']
  );
  assert.deepEqual(capturedMergeRuleSetsInput?.projectRules, []);
  assert.deepEqual(capturedMergeRuleSetsInput?.options, {
    allowDowngradeBaseline: false,
  });
  assert.deepEqual(capturedEvaluateRulesInput?.rules, [mergedRule]);
  assert.deepEqual(capturedEvaluateRulesInput?.facts, [...inputFacts, ...heuristicFacts]);
  assert.deepEqual(capturedTraceabilityInput?.findings, findings);
  assert.deepEqual(capturedTraceabilityInput?.rules, [mergedRule]);
  assert.deepEqual(capturedTraceabilityInput?.facts, [...inputFacts, ...heuristicFacts]);
  assert.deepEqual(result.detectedPlatforms, detectedPlatforms);
  assert.deepEqual(result.skillsRuleSet, skillsRuleSet);
  assert.deepEqual(result.projectRules, []);
  assert.deepEqual(result.baselineRules, [baselineRule]);
  assert.deepEqual(result.heuristicRules, []);
  assert.deepEqual(result.mergedRules, [mergedRule]);
  assert.deepEqual(result.evaluationFacts, [...inputFacts, ...heuristicFacts]);
  assert.deepEqual(result.coverage, {
    factsTotal: 2,
    filesScanned: 1,
    rulesTotal: 1,
    baselineRules: 1,
    heuristicRules: 0,
    skillsRules: 1,
    projectRules: 0,
    matchedRules: 1,
    unmatchedRules: 0,
    unevaluatedRules: 0,
    activeRuleIds: ['merged.rule'],
    evaluatedRuleIds: ['merged.rule'],
    matchedRuleIds: ['merged.rule'],
    unmatchedRuleIds: [],
    unevaluatedRuleIds: [],
  });
  assert.deepEqual(result.findings, findings);
});

test('evaluatePlatformGateFindings mantiene scope TS platform cuando hay archivos en apps/*', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/orders.service.ts',
      content: 'export const x = 1;',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [makeRule('skills.rule')],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
  };

  let capturedExtractHeuristicFactsInput:
    | {
      facts: ReadonlyArray<Fact>;
      detectedPlatforms: DetectedPlatforms;
      typeScriptScope?: 'platform' | 'all';
    }
    | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
    loadSkillsRuleSetForStage: () => skillsRuleSet,
    buildCombinedBaselineRules: () => [],
    extractHeuristicFacts: (input) => {
      capturedExtractHeuristicFactsInput = input;
      return [];
    },
    applyHeuristicSeverityForStage: () => [],
    loadProjectRules: () => undefined,
    mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    evaluateRules: () => [],
    attachFindingTraceability: (input) => input.findings,
  };

  evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    deps
  );

  assert.deepEqual(capturedExtractHeuristicFactsInput, {
    facts: inputFacts,
    detectedPlatforms,
    typeScriptScope: 'platform',
  });
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para SRP backend', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/runtime/pumuki-srp-canary.ts',
      content: [
        'export class PumukiSrpCommandQueryCanary {',
        '  getById(id: string): { id: string; status: "draft" } {',
        '    return { id, status: "draft" };',
        '  }',
        '',
        '  save(id: string): void {',
        '    void id;',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [
      {
        id: 'skills.backend.no-solid-violations',
        description: 'Disallow backend SOLID violations in production code.',
        severity: 'ERROR',
        platform: 'backend',
        locked: true,
        when: {
          kind: 'Any',
          conditions: [
            {
              kind: 'Heuristic',
              where: {
                ruleId: 'heuristics.ts.solid.srp.class-command-query-mix.ast',
                filePathPrefix: 'apps/backend/',
              },
            },
          ],
        },
        then: {
          kind: 'Finding',
          code: 'SKILLS_SKILLS_BACKEND_NO_SOLID_VIOLATIONS',
          message: 'Disallow backend SOLID violations in production code.',
          source:
            'skills-ir:rule=skills.backend.no-solid-violations;source_skill=backend-guidelines',
        },
      },
    ],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set([
      'heuristics.ts.solid.srp.class-command-query-mix.ast',
    ]),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'skills.backend.no-solid-violations'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'ERROR');
  assert.equal(finding.blocking, true);
  assert.equal(finding.filePath, 'apps/backend/src/runtime/pumuki-srp-canary.ts');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiSrpCommandQueryCanary',
    lines: [1],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'query:getById', lines: [2] },
    { kind: 'member', name: 'command:save', lines: [6] },
  ]);
  assert.match(finding.why ?? '', /SRP/i);
  assert.match(finding.impact ?? '', /lecturas y escrituras/i);
  assert.match(finding.expected_fix ?? '', /lectura y escritura/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['skills.backend.no-solid-violations']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para DIP backend', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/orders/application/pumuki-dip-canary.ts',
      content: [
        "import { PrismaClient } from '@prisma/client';",
        '',
        'export class PumukiDipCanaryUseCase {',
        '  private readonly prisma = new PrismaClient();',
        '',
        '  async execute(orderId: string): Promise<void> {',
        '    await this.prisma.order.update({',
        '      where: { id: orderId },',
        "      data: { status: 'draft' },",
        '    });',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [
      {
        id: 'skills.backend.no-solid-violations',
        description: 'Disallow backend SOLID violations in production code.',
        severity: 'ERROR',
        platform: 'backend',
        locked: true,
        when: {
          kind: 'Any',
          conditions: [
            {
              kind: 'Heuristic',
              where: {
                ruleId: 'heuristics.ts.solid.dip.framework-import.ast',
                filePathPrefix: 'apps/backend/',
              },
            },
            {
              kind: 'Heuristic',
              where: {
                ruleId: 'heuristics.ts.solid.dip.concrete-instantiation.ast',
                filePathPrefix: 'apps/backend/',
              },
            },
          ],
        },
        then: {
          kind: 'Finding',
          code: 'SKILLS_SKILLS_BACKEND_NO_SOLID_VIOLATIONS',
          message: 'Disallow backend SOLID violations in production code.',
          source:
            'skills-ir:rule=skills.backend.no-solid-violations;source_skill=backend-guidelines',
        },
      },
    ],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set([
      'heuristics.ts.solid.dip.framework-import.ast',
      'heuristics.ts.solid.dip.concrete-instantiation.ast',
    ]),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'skills.backend.no-solid-violations'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'ERROR');
  assert.equal(finding.blocking, true);
  assert.equal(finding.filePath, 'apps/backend/src/orders/application/pumuki-dip-canary.ts');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiDipCanaryUseCase',
    lines: [3],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'import:@prisma/client', lines: [1] },
    { kind: 'call', name: 'new PrismaClient', lines: [4] },
  ]);
  assert.match(finding.why ?? '', /DIP/i);
  assert.match(finding.impact ?? '', /infraestructura concreta/i);
  assert.match(finding.expected_fix ?? '', /puerto|abstracci/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['skills.backend.no-solid-violations']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para OCP backend', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/orders/application/pumuki-ocp-canary-use-case.ts',
      content: [
        'export class PumukiOcpBackendCanaryUseCase {',
        '  resolveChannel(request: { kind: string }): string {',
        '    switch (request.kind) {',
        "      case 'pickup':",
        "        return 'pickup-banner';",
        "      case 'delivery':",
        "        return 'delivery-banner';",
        '      default:',
        "        return 'generic-banner';",
        '    }',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [
      {
        id: 'skills.backend.no-solid-violations',
        description: 'Disallow backend SOLID violations in production code.',
        severity: 'ERROR',
        platform: 'backend',
        locked: true,
        when: {
          kind: 'Any',
          conditions: [
            {
              kind: 'Heuristic',
              where: {
                ruleId: 'heuristics.ts.solid.ocp.discriminator-switch.ast',
                filePathPrefix: 'apps/backend/',
              },
            },
          ],
        },
        then: {
          kind: 'Finding',
          code: 'SKILLS_SKILLS_BACKEND_NO_SOLID_VIOLATIONS',
          message: 'Disallow backend SOLID violations in production code.',
          source:
            'skills-ir:rule=skills.backend.no-solid-violations;source_skill=backend-guidelines',
        },
      },
    ],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set(['heuristics.ts.solid.ocp.discriminator-switch.ast']),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'skills.backend.no-solid-violations'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'ERROR');
  assert.equal(finding.blocking, true);
  assert.equal(finding.filePath, 'apps/backend/src/orders/application/pumuki-ocp-canary-use-case.ts');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiOcpBackendCanaryUseCase',
    lines: [1],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'discriminator switch: kind', lines: [3] },
    { kind: 'member', name: 'case:pickup', lines: [4] },
    { kind: 'member', name: 'case:delivery', lines: [6] },
  ]);
  assert.match(finding.why ?? '', /OCP/i);
  assert.match(finding.impact ?? '', /nuevo caso|modificar/i);
  assert.match(finding.expected_fix ?? '', /estrategia|polimorfismo|mapa/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['skills.backend.no-solid-violations']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para ISP backend', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/orders/application/pumuki-isp-canary-use-case.ts',
      content: [
        'export interface PumukiIspBackendCatalogPort {',
        '  findById(id: string): Promise<string>;',
        '  saveSnapshot(snapshot: unknown): Promise<void>;',
        '}',
        '',
        'export class PumukiIspBackendCanaryUseCase {',
        '  private readonly catalogPort: PumukiIspBackendCatalogPort;',
        '',
        '  async execute(id: string): Promise<string> {',
        '    return this.catalogPort.findById(id);',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [
      {
        id: 'skills.backend.no-solid-violations',
        description: 'Disallow backend SOLID violations in production code.',
        severity: 'ERROR',
        platform: 'backend',
        locked: true,
        when: {
          kind: 'Any',
          conditions: [
            {
              kind: 'Heuristic',
              where: {
                ruleId: 'heuristics.ts.solid.isp.interface-command-query-mix.ast',
                filePathPrefix: 'apps/backend/',
              },
            },
          ],
        },
        then: {
          kind: 'Finding',
          code: 'SKILLS_SKILLS_BACKEND_NO_SOLID_VIOLATIONS',
          message: 'Disallow backend SOLID violations in production code.',
          source:
            'skills-ir:rule=skills.backend.no-solid-violations;source_skill=backend-guidelines',
        },
      },
    ],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set(['heuristics.ts.solid.isp.interface-command-query-mix.ast']),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'skills.backend.no-solid-violations'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'ERROR');
  assert.equal(finding.blocking, true);
  assert.equal(finding.filePath, 'apps/backend/src/orders/application/pumuki-isp-canary-use-case.ts');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiIspBackendCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'fat interface: PumukiIspBackendCatalogPort', lines: [1] },
    { kind: 'member', name: 'used member: findById', lines: [10] },
    { kind: 'member', name: 'unused contract member: saveSnapshot', lines: [3] },
  ]);
  assert.match(finding.why ?? '', /ISP/i);
  assert.match(finding.impact ?? '', /contrato|acopla|test/i);
  assert.match(finding.expected_fix ?? '', /puertos|separa|split/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['skills.backend.no-solid-violations']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para LSP backend', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/orders/application/pumuki-lsp-canary-use-case.ts',
      content: [
        'export abstract class PumukiLspBackendCanaryDiscountPolicy {',
        '  abstract apply(amount: number): number;',
        '}',
        '',
        'export class PumukiLspBackendStandardDiscountPolicy extends PumukiLspBackendCanaryDiscountPolicy {',
        '  override apply(amount: number): number {',
        '    return amount * 0.9;',
        '  }',
        '}',
        '',
        'export class PumukiLspBackendPremiumDiscountPolicy extends PumukiLspBackendCanaryDiscountPolicy {',
        '  override apply(amount: number): number {',
        '    throw new Error("Not implemented for low amount");',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [
      {
        id: 'skills.backend.no-solid-violations',
        description: 'Disallow backend SOLID violations in production code.',
        severity: 'ERROR',
        platform: 'backend',
        locked: true,
        when: {
          kind: 'Any',
          conditions: [
            {
              kind: 'Heuristic',
              where: {
                ruleId: 'heuristics.ts.solid.lsp.override-not-implemented.ast',
                filePathPrefix: 'apps/backend/',
              },
            },
          ],
        },
        then: {
          kind: 'Finding',
          code: 'SKILLS_SKILLS_BACKEND_NO_SOLID_VIOLATIONS',
          message: 'Disallow backend SOLID violations in production code.',
          source:
            'skills-ir:rule=skills.backend.no-solid-violations;source_skill=backend-guidelines',
        },
      },
    ],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set(['heuristics.ts.solid.lsp.override-not-implemented.ast']),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'skills.backend.no-solid-violations'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'ERROR');
  assert.equal(finding.blocking, true);
  assert.equal(finding.filePath, 'apps/backend/src/orders/application/pumuki-lsp-canary-use-case.ts');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiLspBackendPremiumDiscountPolicy',
    lines: [11],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspBackendCanaryDiscountPolicy', lines: [1] },
    { kind: 'member', name: 'safe substitute: PumukiLspBackendStandardDiscountPolicy', lines: [5] },
    { kind: 'member', name: 'unsafe override: apply', lines: [12] },
    { kind: 'call', name: 'throw not implemented', lines: [13] },
  ]);
  assert.match(finding.why ?? '', /LSP/i);
  assert.match(finding.impact ?? '', /sustituci|regresion|crash/i);
  assert.match(finding.expected_fix ?? '', /contrato|estrategia|subtipo/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['skills.backend.no-solid-violations']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para SRP iOS', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/Validation/Presentation/PumukiSrpIosCanaryViewModel.swift',
      content: [
        '@MainActor',
        'final class PumukiSrpIosCanaryViewModel {',
        '  private let coordinator: StoreMapCoordinator',
        '',
        '  func restoreSessionSnapshot() async {}',
        '',
        '  func fetchRemoteCatalog() async throws {',
        '    _ = URLSession.shared',
        '  }',
        '',
        '  func cacheLastStoreID(_ storeID: String) {',
        '    UserDefaults.standard.set(storeID, forKey: "last-store-id")',
        '  }',
        '',
        '  func openStoreMap() {',
        '    coordinator.navigate(to: .storeMap)',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    ios: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const srpRule = iosEnterpriseRuleSet.find(
    (rule) => rule.id === 'ios.solid.srp.presentation-mixed-responsibilities'
  );
  assert.ok(srpRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [srpRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'ios.solid.srp.presentation-mixed-responsibilities'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/ios/Sources/Validation/Presentation/PumukiSrpIosCanaryViewModel.swift'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiSrpIosCanaryViewModel',
    lines: [2],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'session/auth flow', lines: [5] },
    { kind: 'call', name: 'remote networking', lines: [8] },
    { kind: 'call', name: 'local persistence', lines: [12] },
    { kind: 'member', name: 'navigation flow', lines: [16] },
  ]);
  assert.match(finding.why ?? '', /SRP/i);
  assert.match(finding.impact ?? '', /múltiples razones de cambio/i);
  assert.match(finding.expected_fix ?? '', /coordinadores|casos de uso/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['ios.solid.srp.presentation-mixed-responsibilities']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para DIP iOS', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/Validation/Application/PumukiDipIosCanaryUseCase.swift',
      content: [
        'import Foundation',
        '',
        'final class PumukiDipIosCanaryUseCase {',
        '  private let session: URLSession',
        '  private let preferences: UserDefaults',
        '',
        '  init() {',
        '    self.session = URLSession.shared',
        '    self.preferences = UserDefaults.standard',
        '  }',
        '',
        '  func execute() async throws {',
        '    guard let url = URL(string: "https://example.com/catalog.json") else {',
        '      return',
        '    }',
        '',
        '    _ = try await session.data(from: url)',
        '    preferences.set(Date().timeIntervalSince1970, forKey: "last-sync")',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    ios: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const dipRule = iosEnterpriseRuleSet.find(
    (rule) => rule.id === 'ios.solid.dip.concrete-framework-dependency'
  );
  assert.ok(dipRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [dipRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'ios.solid.dip.concrete-framework-dependency'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/ios/Sources/Validation/Application/PumukiDipIosCanaryUseCase.swift'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiDipIosCanaryUseCase',
    lines: [3],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'property', name: 'concrete dependency: URLSession', lines: [4] },
    { kind: 'call', name: 'URLSession.shared', lines: [8] },
    { kind: 'property', name: 'concrete dependency: UserDefaults', lines: [5] },
    { kind: 'call', name: 'UserDefaults.standard', lines: [9] },
  ]);
  assert.match(finding.why ?? '', /DIP/i);
  assert.match(finding.impact ?? '', /infraestructura|coste de sustituir/i);
  assert.match(finding.expected_fix ?? '', /puertos|infrastructure/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['ios.solid.dip.concrete-framework-dependency']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para OCP iOS', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/Validation/Application/PumukiOcpIosCanaryUseCase.swift',
      content: [
        'enum PumukiOcpIosCanaryChannel {',
        '  case groceryPickup',
        '  case homeDelivery',
        '}',
        '',
        'final class PumukiOcpIosCanaryUseCase {',
        '  func makeBanner(for channel: PumukiOcpIosCanaryChannel) -> String {',
        '    switch channel {',
        '    case .groceryPickup:',
        '      return "pickup"',
        '    case .homeDelivery:',
        '      return "delivery"',
        '    }',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    ios: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const ocpRule = iosEnterpriseRuleSet.find(
    (rule) => rule.id === 'ios.solid.ocp.discriminator-switch-branching'
  );
  assert.ok(ocpRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [ocpRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'ios.solid.ocp.discriminator-switch-branching'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/ios/Sources/Validation/Application/PumukiOcpIosCanaryUseCase.swift'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiOcpIosCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'discriminator switch: channel', lines: [8] },
    { kind: 'member', name: 'case .groceryPickup', lines: [9] },
    { kind: 'member', name: 'case .homeDelivery', lines: [11] },
  ]);
  assert.match(finding.why ?? '', /OCP/i);
  assert.match(finding.impact ?? '', /nuevo caso|nuevo comportamiento/i);
  assert.match(finding.expected_fix ?? '', /estrategia|protocolo|registry/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['ios.solid.ocp.discriminator-switch-branching']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para ISP iOS', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/Validation/Application/PumukiIspIosCanaryUseCase.swift',
      content: [
        'protocol PumukiIspIosCanarySessionManaging {',
        '  func restoreSession() async throws',
        '  func persistSessionID(_ id: String) async',
        '  func clearSession() async',
        '  func refreshToken() async throws -> String',
        '}',
        '',
        'final class PumukiIspIosCanaryUseCase {',
        '  private let sessionManager: PumukiIspIosCanarySessionManaging',
        '',
        '  init(sessionManager: PumukiIspIosCanarySessionManaging) {',
        '    self.sessionManager = sessionManager',
        '  }',
        '',
        '  func execute() async throws {',
        '    try await sessionManager.restoreSession()',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    ios: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const ispRule = iosEnterpriseRuleSet.find(
    (rule) => rule.id === 'ios.solid.isp.fat-protocol-dependency'
  );
  assert.ok(ispRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [ispRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'ios.solid.isp.fat-protocol-dependency'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/ios/Sources/Validation/Application/PumukiIspIosCanaryUseCase.swift'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiIspIosCanaryUseCase',
    lines: [8],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'fat protocol: PumukiIspIosCanarySessionManaging', lines: [1] },
    { kind: 'call', name: 'used member: restoreSession', lines: [16] },
    { kind: 'member', name: 'unused contract member: persistSessionID', lines: [3] },
    { kind: 'member', name: 'unused contract member: clearSession', lines: [4] },
  ]);
  assert.match(finding.why ?? '', /ISP/i);
  assert.match(finding.impact ?? '', /contrato demasiado ancho|cambios ajenos/i);
  assert.match(finding.expected_fix ?? '', /puertos pequeños|puerto mínimo/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['ios.solid.isp.fat-protocol-dependency']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para LSP iOS', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/Validation/Application/PumukiLspIosCanaryDiscount.swift',
      content: [
        'protocol PumukiLspIosCanaryDiscountApplying {',
        '  func apply(to amount: Decimal) -> Decimal',
        '}',
        '',
        'final class PumukiLspIosCanaryStandardDiscount: PumukiLspIosCanaryDiscountApplying {',
        '  func apply(to amount: Decimal) -> Decimal {',
        '    amount * 0.9',
        '  }',
        '}',
        '',
        'final class PumukiLspIosCanaryPremiumDiscount: PumukiLspIosCanaryDiscountApplying {',
        '  func apply(to amount: Decimal) -> Decimal {',
        '    guard amount >= 100 else {',
        '      fatalError(\"premium-only\")',
        '    }',
        '    return amount * 0.8',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    ios: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const lspRule = iosEnterpriseRuleSet.find(
    (rule) => rule.id === 'ios.solid.lsp.narrowed-precondition-substitution'
  );
  assert.ok(lspRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [lspRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'ios.solid.lsp.narrowed-precondition-substitution'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/ios/Sources/Validation/Application/PumukiLspIosCanaryDiscount.swift'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiLspIosCanaryPremiumDiscount',
    lines: [11],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspIosCanaryDiscountApplying', lines: [1] },
    { kind: 'member', name: 'safe substitute: PumukiLspIosCanaryStandardDiscount', lines: [5] },
    { kind: 'member', name: 'narrowed precondition: apply', lines: [13] },
    { kind: 'call', name: 'fatalError', lines: [14] },
  ]);
  assert.match(finding.why ?? '', /LSP/i);
  assert.match(finding.impact ?? '', /sustitución|regresiones/i);
  assert.match(finding.expected_fix ?? '', /contrato base|estrategia/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['ios.solid.lsp.narrowed-precondition-substitution']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para SRP Android', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/android/app/src/main/kotlin/com/acme/validation/presentation/PumukiSrpAndroidCanaryViewModel.kt',
      content: [
        'import android.content.SharedPreferences',
        'import androidx.lifecycle.ViewModel',
        'import androidx.navigation.NavController',
        'import okhttp3.OkHttpClient',
        'import okhttp3.Request',
        '',
        'class PumukiSrpAndroidCanaryViewModel(',
        '  private val navController: NavController,',
        ') : ViewModel() {',
        '  fun restoreSessionSnapshot() {}',
        '',
        '  suspend fun fetchRemoteCatalog() {',
        '    val client = OkHttpClient()',
        '    client.newCall(',
        '      Request.Builder()',
        '        .url("https://example.com/catalog.json")',
        '        .build()',
        '    )',
        '  }',
        '',
        '  fun cacheLastStore(preferences: SharedPreferences, storeId: String) {',
        '    preferences.edit().putString("last-store-id", storeId).apply()',
        '  }',
        '',
        '  fun openStoreMap() {',
        '    navController.navigate("store-map")',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    android: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const srpRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.srp.presentation-mixed-responsibilities'
  );
  assert.ok(srpRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [srpRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'android.solid.srp.presentation-mixed-responsibilities'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/android/app/src/main/kotlin/com/acme/validation/presentation/PumukiSrpAndroidCanaryViewModel.kt'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiSrpAndroidCanaryViewModel',
    lines: [7],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'session/auth flow', lines: [10] },
    { kind: 'call', name: 'remote networking', lines: [13] },
    { kind: 'call', name: 'local persistence', lines: [21] },
    { kind: 'member', name: 'navigation flow', lines: [26] },
  ]);
  assert.match(finding.why ?? '', /SRP/i);
  assert.match(finding.impact ?? '', /múltiples razones de cambio/i);
  assert.match(finding.expected_fix ?? '', /coordinadores|casos de uso/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['android.solid.srp.presentation-mixed-responsibilities']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para DIP Android', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiDipAndroidCanaryUseCase.kt',
      content: [
        'import android.content.SharedPreferences',
        'import okhttp3.OkHttpClient',
        'import okhttp3.Request',
        '',
        'class PumukiDipAndroidCanaryUseCase(',
        '  private val preferences: SharedPreferences,',
        ') {',
        '  private val client: OkHttpClient = OkHttpClient()',
        '',
        '  suspend fun execute() {',
        '    val request = Request.Builder()',
        '      .url("https://example.com/catalog.json")',
        '      .build()',
        '',
        '    client.newCall(request)',
        '    preferences.edit().putLong("last-sync", 1L).apply()',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    android: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const dipRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.dip.concrete-framework-dependency'
  );
  assert.ok(dipRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [dipRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'android.solid.dip.concrete-framework-dependency'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiDipAndroidCanaryUseCase.kt'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiDipAndroidCanaryUseCase',
    lines: [5],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'property', name: 'concrete dependency: SharedPreferences', lines: [6] },
    { kind: 'property', name: 'concrete dependency: OkHttpClient', lines: [8] },
    { kind: 'call', name: 'OkHttpClient()', lines: [8] },
  ]);
  assert.match(finding.why ?? '', /DIP/i);
  assert.match(finding.impact ?? '', /infraestructura|alto nivel|coste de sustituir/i);
  assert.match(finding.expected_fix ?? '', /puertos|abstracciones|gateways/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['android.solid.dip.concrete-framework-dependency']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para OCP Android', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiOcpAndroidCanaryUseCase.kt',
      content: [
        'enum class PumukiOcpAndroidCanaryChannel {',
        '  GroceryPickup,',
        '  HomeDelivery,',
        '}',
        '',
        'class PumukiOcpAndroidCanaryUseCase {',
        '  fun resolve(channel: PumukiOcpAndroidCanaryChannel): String {',
        '    return when (channel) {',
        '      PumukiOcpAndroidCanaryChannel.GroceryPickup -> "pickup"',
        '      PumukiOcpAndroidCanaryChannel.HomeDelivery -> "delivery"',
        '    }',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    android: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const ocpRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.ocp.discriminator-branching'
  );
  assert.ok(ocpRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [ocpRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'android.solid.ocp.discriminator-branching'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiOcpAndroidCanaryUseCase.kt'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiOcpAndroidCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'discriminator switch: channel', lines: [8] },
    { kind: 'member', name: 'branch GroceryPickup', lines: [9] },
    { kind: 'member', name: 'branch HomeDelivery', lines: [10] },
  ]);
  assert.match(finding.why ?? '', /OCP/i);
  assert.match(finding.impact ?? '', /nuevo caso|modificar/i);
  assert.match(finding.expected_fix ?? '', /estrategia|interfaz|registry/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['android.solid.ocp.discriminator-branching']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para ISP Android', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiIspAndroidCanaryUseCase.kt',
      content: [
        'interface PumukiIspAndroidCanarySessionPort {',
        '  suspend fun restoreSession()',
        '  suspend fun persistSessionID(id: String)',
        '  suspend fun clearSession()',
        '  suspend fun refreshToken(): String',
        '}',
        '',
        'class PumukiIspAndroidCanaryUseCase(',
        '  private val sessionPort: PumukiIspAndroidCanarySessionPort,',
        ') {',
        '  suspend fun execute() {',
        '    sessionPort.restoreSession()',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    android: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const ispRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.isp.fat-interface-dependency'
  );
  assert.ok(ispRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [ispRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'android.solid.isp.fat-interface-dependency'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiIspAndroidCanaryUseCase.kt'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiIspAndroidCanaryUseCase',
    lines: [8],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'fat interface: PumukiIspAndroidCanarySessionPort', lines: [1] },
    { kind: 'call', name: 'used member: restoreSession', lines: [12] },
    { kind: 'member', name: 'unused contract member: persistSessionID', lines: [3] },
    { kind: 'member', name: 'unused contract member: clearSession', lines: [4] },
  ]);
  assert.match(finding.why ?? '', /ISP/i);
  assert.match(finding.impact ?? '', /contrato demasiado ancho|cambios ajenos/i);
  assert.match(finding.expected_fix ?? '', /interfaces pequeñas|puerto mínimo/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['android.solid.isp.fat-interface-dependency']);
});

test('evaluatePlatformGateFindings materializa finding semantico y bloqueante para LSP Android', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiLspAndroidCanaryDiscountPolicy.kt',
      content: [
        'interface PumukiLspAndroidCanaryDiscountPolicy {',
        '  fun apply(amount: Double): Double',
        '}',
        '',
        'class PumukiLspAndroidCanaryStandardDiscountPolicy : PumukiLspAndroidCanaryDiscountPolicy {',
        '  override fun apply(amount: Double): Double {',
        '    return amount * 0.9',
        '  }',
        '}',
        '',
        'class PumukiLspAndroidCanaryPremiumDiscountPolicy : PumukiLspAndroidCanaryDiscountPolicy {',
        '  override fun apply(amount: Double): Double {',
        '    require(amount >= 100.0)',
        '    error(\"premium-only\")',
        '  }',
        '}',
      ].join('\n'),
      source: 'git:working-tree',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    android: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
    unsupportedAutoRuleIds: [],
  };

  const lspRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.lsp.narrowed-precondition-substitution'
  );
  assert.ok(lspRule);

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => detectedPlatforms,
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => skillsRuleSet,
      buildCombinedBaselineRules: () => [lspRule],
      loadProjectRules: () => undefined,
      mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    }
  );

  const finding = result.findings.find(
    (entry) => entry.ruleId === 'android.solid.lsp.narrowed-precondition-substitution'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.equal(finding.blocking, true);
  assert.equal(
    finding.filePath,
    'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiLspAndroidCanaryDiscountPolicy.kt'
  );
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiLspAndroidCanaryPremiumDiscountPolicy',
    lines: [11],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspAndroidCanaryDiscountPolicy', lines: [1] },
    { kind: 'member', name: 'safe substitute: PumukiLspAndroidCanaryStandardDiscountPolicy', lines: [5] },
    { kind: 'member', name: 'narrowed precondition: apply', lines: [13] },
    { kind: 'call', name: 'error', lines: [14] },
  ]);
  assert.match(finding.why ?? '', /LSP/i);
  assert.match(finding.impact ?? '', /sustituci|regresion|crash/i);
  assert.match(finding.expected_fix ?? '', /contrato base|estrategia|subtipo/i);
  assert.deepEqual(result.coverage.matchedRuleIds, ['android.solid.lsp.narrowed-precondition-substitution']);
});

test('evaluatePlatformGateFindings filtra heuristicas mapeadas y permite downgrade cuando projectRules lo habilita', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'src/a.ts',
      content: 'console.log("x")',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const baselineRule = makeRule('baseline.rule');
  const heuristicKeptRule = makeRule('heuristic.keep');
  const heuristicFilteredRule = makeRule('heuristic.filtered');
  const skillsRule = makeRule('skills.rule');
  const projectRule = makeRule('project.rule', 'ERROR');
  const mergedRule = makeRule('merged.rule', 'ERROR');
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'merged.rule',
      severity: 'ERROR',
      code: 'MERGED_RULE',
      message: 'finding',
      filePath: 'src/a.ts',
    },
  ];
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [skillsRule],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(['heuristic.filtered']),
    requiresHeuristicFacts: false,
  };

  let applyHeuristicSeverityStage: 'STAGED' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | undefined;
  let extractHeuristicFactsInvocations = 0;
  let capturedMergeRuleSetsInput:
    | {
      baselineRules: RuleSet;
      projectRules: RuleSet;
      options?: { allowDowngradeBaseline?: boolean };
    }
    | undefined;
  let capturedEvaluateRulesInput:
    | {
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;
  let capturedTraceabilityInput:
    | {
      findings: ReadonlyArray<Finding>;
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: true, typeScriptScope: 'platform' }),
    loadSkillsRuleSetForStage: () => skillsRuleSet,
    buildCombinedBaselineRules: () => [baselineRule],
    extractHeuristicFacts: () => {
      extractHeuristicFactsInvocations += 1;
      return [];
    },
    applyHeuristicSeverityForStage: (_rules, stage) => {
      applyHeuristicSeverityStage = stage;
      return [heuristicKeptRule, heuristicFilteredRule];
    },
    loadProjectRules: () => ({
      rules: [projectRule],
      allowOverrideLocked: true,
    }),
    mergeRuleSets: (baselineRules, projectRules, options) => {
      capturedMergeRuleSetsInput = { baselineRules, projectRules, options };
      return [mergedRule];
    },
    evaluateRules: (rules, factsArg) => {
      capturedEvaluateRulesInput = { rules, facts: factsArg };
      return findings;
    },
    attachFindingTraceability: (input) => {
      capturedTraceabilityInput = input;
      return input.findings;
    },
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    },
    deps
  );

  assert.equal(applyHeuristicSeverityStage, 'PRE_PUSH');
  assert.equal(extractHeuristicFactsInvocations, 1);
  assert.deepEqual(
    capturedMergeRuleSetsInput?.baselineRules.map((rule) => rule.id),
    ['baseline.rule', 'heuristic.keep', 'skills.rule']
  );
  assert.deepEqual(capturedMergeRuleSetsInput?.projectRules.map((rule) => rule.id), [
    'project.rule',
  ]);
  assert.deepEqual(capturedMergeRuleSetsInput?.options, {
    allowDowngradeBaseline: true,
  });
  assert.deepEqual(capturedEvaluateRulesInput?.rules, [mergedRule]);
  assert.deepEqual(capturedEvaluateRulesInput?.facts, inputFacts);
  assert.deepEqual(capturedTraceabilityInput?.findings, findings);
  assert.deepEqual(capturedTraceabilityInput?.rules, [mergedRule]);
  assert.deepEqual(capturedTraceabilityInput?.facts, inputFacts);
  assert.deepEqual(result.detectedPlatforms, detectedPlatforms);
  assert.deepEqual(result.skillsRuleSet, skillsRuleSet);
  assert.deepEqual(result.projectRules, [projectRule]);
  assert.deepEqual(result.baselineRules, [baselineRule]);
  assert.deepEqual(result.heuristicRules.map((rule) => rule.id), ['heuristic.keep']);
  assert.deepEqual(result.mergedRules, [mergedRule]);
  assert.deepEqual(result.evaluationFacts, inputFacts);
  assert.deepEqual(result.coverage, {
    factsTotal: 1,
    filesScanned: 1,
    rulesTotal: 1,
    baselineRules: 1,
    heuristicRules: 1,
    skillsRules: 1,
    projectRules: 1,
    matchedRules: 1,
    unmatchedRules: 0,
    unevaluatedRules: 0,
    activeRuleIds: ['merged.rule'],
    evaluatedRuleIds: ['merged.rule'],
    matchedRuleIds: ['merged.rule'],
    unmatchedRuleIds: [],
    unevaluatedRuleIds: [],
  });
  assert.deepEqual(result.findings, findings);
});

test('evaluatePlatformGateFindings propaga rutas observadas al loader de skills para scope por fichero', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'server/src/orders.service.ts',
      content: 'export class OrdersService {}',
      source: 'test',
    },
    {
      kind: 'FileContent',
      path: 'mobile/ios/MainView.swift',
      content: 'struct MainView: View { var body: some View { Text("x") } }',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    ios: { detected: true, confidence: 'HIGH' },
    backend: { detected: true, confidence: 'HIGH' },
  };
  const mergedRule = makeRule('merged.rule');
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
    unsupportedAutoRuleIds: [],
  };

  let capturedObservedFilePaths: ReadonlyArray<string> | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
    loadSkillsRuleSetForStage: (_stage, _repoRoot, _detectedPlatforms, observedFilePaths) => {
      capturedObservedFilePaths = observedFilePaths;
      return skillsRuleSet;
    },
    buildCombinedBaselineRules: () => [],
    extractHeuristicFacts: () => [],
    applyHeuristicSeverityForStage: () => [],
    loadProjectRules: () => undefined,
    mergeRuleSets: () => [mergedRule],
    evaluateRules: () => [],
    attachFindingTraceability: (input) => input.findings,
  };

  evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    deps
  );

  assert.deepEqual(
    capturedObservedFilePaths,
    ['mobile/ios/MainView.swift', 'server/src/orders.service.ts']
  );
});

test('evaluatePlatformGateFindings usa evaluatedRuleIds capturados en evaluacion cuando no hay override de evaluateRules', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'test',
    },
  ];
  const mergedRules: RuleSet = [makeRule('rule.active.a'), makeRule('rule.active.b')];
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'rule.active.a',
      severity: 'WARN',
      code: 'RULE_ACTIVE_A',
      message: 'finding',
      filePath: 'src/a.ts',
    },
  ];

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => ({}),
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => ({
        rules: [],
        activeBundles: [],
        mappedHeuristicRuleIds: new Set<string>(),
        requiresHeuristicFacts: false,
      }),
      buildCombinedBaselineRules: () => [],
      extractHeuristicFacts: () => [],
      applyHeuristicSeverityForStage: () => [],
      loadProjectRules: () => undefined,
      mergeRuleSets: () => mergedRules,
      evaluateRulesWithCoverage: () => ({
        findings,
        evaluatedRuleIds: ['rule.active.a'],
      }),
      attachFindingTraceability: (input) => input.findings,
    }
  );

  assert.deepEqual(result.coverage.activeRuleIds, ['rule.active.a', 'rule.active.b']);
  assert.deepEqual(result.coverage.evaluatedRuleIds, ['rule.active.a']);
  assert.deepEqual(result.coverage.matchedRuleIds, ['rule.active.a']);
  assert.deepEqual(result.coverage.unmatchedRuleIds, []);
  assert.deepEqual(result.coverage.unevaluatedRuleIds, ['rule.active.b']);
  assert.equal(result.coverage.unmatchedRules, 0);
  assert.equal(result.coverage.unevaluatedRules, 1);
});
