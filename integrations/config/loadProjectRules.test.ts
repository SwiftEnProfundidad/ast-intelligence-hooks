import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../__tests__/helpers/tempDir';
import { loadProjectRules } from './loadProjectRules';

const withCwd = async <T>(cwd: string, callback: () => Promise<T> | T): Promise<T> => {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return await callback();
  } finally {
    process.chdir(previous);
  }
};

const writeRulesModule = (filePath: string, value: unknown): void => {
  writeFileSync(filePath, `module.exports = ${JSON.stringify(value, null, 2)};\n`, 'utf8');
};

const buildRuleConfig = (id: string) => ({
  rules: [
    {
      id,
      description: `Rule ${id}`,
      severity: 'ERROR',
      when: { kind: 'FileChange', where: { pathPrefix: 'apps/' } },
      then: { kind: 'Finding', message: `Finding ${id}` },
    },
  ],
});

test('loadProjectRules prioriza .pumuki/rules.ts sobre pumuki.rules.ts', async () => {
  await withTempDir('pumuki-project-rules-', async (tempRoot) => {
    const localDir = join(tempRoot, '.pumuki');
    mkdirSync(localDir, { recursive: true });

    writeRulesModule(join(localDir, 'rules.ts'), buildRuleConfig('rule.local'));
    writeRulesModule(join(tempRoot, 'pumuki.rules.ts'), buildRuleConfig('rule.root'));

    await withCwd(tempRoot, async () => {
      const config = loadProjectRules();
      assert.equal(config?.rules?.[0]?.id, 'rule.local');
    });
  });
});

test('loadProjectRules usa pumuki.rules.ts cuando no existe .pumuki/rules.ts', async () => {
  await withTempDir('pumuki-project-rules-root-', async (tempRoot) => {
    writeRulesModule(join(tempRoot, 'pumuki.rules.ts'), buildRuleConfig('rule.root.only'));

    await withCwd(tempRoot, async () => {
      const config = loadProjectRules();
      assert.equal(config?.rules?.[0]?.id, 'rule.root.only');
    });
  });
});

test('loadProjectRules devuelve undefined si la configuración no valida contra schema', async () => {
  await withTempDir('pumuki-project-rules-invalid-', async (tempRoot) => {
    writeRulesModule(join(tempRoot, 'pumuki.rules.ts'), {
      rules: [{ id: '', severity: 'CRITICAL' }],
    });

    await withCwd(tempRoot, async () => {
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (message?: unknown, ...optionalParams: unknown[]) => {
        const payload = [message, ...optionalParams].map(String).join(' ');
        warnings.push(payload);
      };

      try {
        const config = loadProjectRules();
        assert.equal(config, undefined);
      } finally {
        console.warn = originalWarn;
      }

      assert.equal(warnings.length > 0, true);
    });
  });
});

test('loadProjectRules acepta default export válido cuando module.exports contiene reglas inválidas', async () => {
  await withTempDir('pumuki-project-rules-default-export-', async (tempRoot) => {
    const localDir = join(tempRoot, '.pumuki');
    mkdirSync(localDir, { recursive: true });
    writeFileSync(
      join(localDir, 'rules.ts'),
      `module.exports = { rules: [{ id: "", severity: "WARN" }], default: ${JSON.stringify(
        buildRuleConfig('rule.default.export'),
        null,
        2
      )} };\n`,
      'utf8'
    );

    await withCwd(tempRoot, async () => {
      const config = loadProjectRules();
      assert.equal(config?.rules?.[0]?.id, 'rule.default.export');
    });
  });
});

test('loadProjectRules cae a pumuki.rules.ts cuando .pumuki/rules.ts existe pero es inválido', async () => {
  await withTempDir('pumuki-project-rules-local-invalid-root-valid-', async (tempRoot) => {
    const localDir = join(tempRoot, '.pumuki');
    mkdirSync(localDir, { recursive: true });
    writeRulesModule(join(localDir, 'rules.ts'), {
      rules: [{ id: '', severity: 'WARN' }],
    });
    writeRulesModule(join(tempRoot, 'pumuki.rules.ts'), buildRuleConfig('rule.root.valid'));

    await withCwd(tempRoot, async () => {
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (message?: unknown, ...optionalParams: unknown[]) => {
        warnings.push([message, ...optionalParams].map(String).join(' '));
      };

      try {
        const config = loadProjectRules();
        assert.equal(config?.rules?.[0]?.id, 'rule.root.valid');
      } finally {
        console.warn = originalWarn;
      }

      assert.equal(warnings.length > 0, true);
    });
  });
});
