import assert from 'node:assert/strict';
import test from 'node:test';
import type { ProjectRulesConfig } from './projectRules';

const asProjectRulesConfig = (value: ProjectRulesConfig): ProjectRulesConfig => value;

test('ProjectRulesConfig admite configuración vacía', () => {
  const config = asProjectRulesConfig({});
  assert.deepEqual(config, {});
});

test('ProjectRulesConfig admite allowOverrideLocked sin reglas', () => {
  const config = asProjectRulesConfig({ allowOverrideLocked: true });
  assert.equal(config.allowOverrideLocked, true);
  assert.equal(Array.isArray(config.rules), false);
});

test('ProjectRulesConfig admite RuleSet tipado con metadatos opcionales', () => {
  const config = asProjectRulesConfig({
    allowOverrideLocked: false,
    rules: [
      {
        id: 'project.backend.no-empty-catch',
        description: 'No empty catch in backend runtime code.',
        severity: 'ERROR',
        when: {
          kind: 'FileChange',
          where: { pathPrefix: 'apps/backend/', changeType: 'modified' },
        },
        then: {
          kind: 'Finding',
          message: 'Empty catch is not allowed.',
          code: 'PUMUKI_BACKEND_EMPTY_CATCH',
        },
        platform: 'backend',
        stage: 'PRE_PUSH',
        scope: {
          include: ['apps/backend/**/*.ts'],
          exclude: ['**/*.spec.ts'],
        },
        confidence: 'HIGH',
        locked: true,
      },
    ],
  });

  assert.equal(config.rules?.length, 1);
  assert.equal(config.rules?.[0]?.id, 'project.backend.no-empty-catch');
  assert.equal(config.rules?.[0]?.platform, 'backend');
});

test('ProjectRulesConfig admite rules vacío con allowOverrideLocked explícito en false', () => {
  const config = asProjectRulesConfig({
    allowOverrideLocked: false,
    rules: [],
  });

  assert.equal(config.allowOverrideLocked, false);
  assert.deepEqual(config.rules, []);
});

test('ProjectRulesConfig admite condiciones compuestas y plataformas text/generic', () => {
  const config = asProjectRulesConfig({
    rules: [
      {
        id: 'project.text.heuristic-and-content',
        description: 'Combina heurística y contenido para gates de texto.',
        severity: 'WARN',
        when: {
          kind: 'All',
          conditions: [
            {
              kind: 'Heuristic',
              where: { ruleId: 'heuristics.ts.console-log.ast' },
            },
            {
              kind: 'FileContent',
              contains: ['console.log'],
            },
          ],
        },
        then: {
          kind: 'Finding',
          message: 'Pattern not allowed for text scope.',
          code: 'PROJECT_TEXT_HEURISTIC_CONTENT',
        },
        platform: 'text',
        stage: 'CI',
      },
      {
        id: 'project.generic.no-dep-cycle',
        description: 'Regla genérica de dependencias.',
        severity: 'ERROR',
        when: {
          kind: 'Dependency',
          where: { from: 'apps/backend', to: 'apps/web' },
        },
        then: {
          kind: 'Finding',
          message: 'Cross-context dependency detected.',
          code: 'PROJECT_GENERIC_DEP',
        },
        platform: 'generic',
      },
    ],
  });

  assert.equal(config.rules?.length, 2);
  assert.equal(config.rules?.[0]?.platform, 'text');
  assert.equal(config.rules?.[1]?.platform, 'generic');
});
