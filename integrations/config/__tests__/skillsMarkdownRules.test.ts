import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCompiledRulesFromSkillMarkdown } from '../skillsMarkdownRules';

test('normaliza reglas backend de SOLID/Clean Architecture/God Class a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
    sourceContent: [
      '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
      '✅ Seguir Clean Architecture - Domain -> Application -> Infrastructure -> Presentation',
      '❌ God classes - Servicios con >500 líneas',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.backend.enforce-clean-architecture',
    'skills.backend.no-god-classes',
    'skills.backend.no-solid-violations',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza regla frontend SOLID a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/windsurf-rules-frontend.md',
    sourceContent: '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP) en componentes',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.frontend.no-solid-violations']);
});

test('reglas no canonicas extraidas desde markdown se degradan a DECLARATIVE para evitar AUTO no mapeado', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
    sourceContent: '- Must avoid long transaction scripts across three bounded contexts.',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id.startsWith('skills.backend.guideline.'), true);
  assert.equal(rules[0]?.evaluationMode, 'DECLARATIVE');
});
