import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { getCurrentPumukiPackageName } from '../packageInfo';
import {
  hasDeclaredDependenciesBeyondPumuki,
  resolveCurrentPumukiDependency,
} from '../consumerPackage';

const writePackageJson = (repoRoot: string, payload: unknown): void => {
  writeFileSync(join(repoRoot, 'package.json'), JSON.stringify(payload, null, 2), 'utf8');
};

test('resolveCurrentPumukiDependency devuelve none cuando no existe package.json', async () => {
  await withTempDir('pumuki-consumer-package-missing-', async (repoRoot) => {
    assert.deepEqual(resolveCurrentPumukiDependency(repoRoot), { source: 'none' });
    assert.equal(hasDeclaredDependenciesBeyondPumuki(repoRoot), false);
  });
});

test('resolveCurrentPumukiDependency prioriza dependencies sobre devDependencies', async () => {
  await withTempDir('pumuki-consumer-package-deps-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    writePackageJson(repoRoot, {
      name: 'fixture',
      version: '1.0.0',
      dependencies: {
        [packageName]: '6.3.11',
      },
      devDependencies: {
        [packageName]: '6.3.10',
      },
    });

    assert.deepEqual(resolveCurrentPumukiDependency(repoRoot), {
      source: 'dependencies',
      spec: '6.3.11',
    });
  });
});

test('resolveCurrentPumukiDependency usa devDependencies cuando no está en dependencies', async () => {
  await withTempDir('pumuki-consumer-package-devdeps-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    writePackageJson(repoRoot, {
      name: 'fixture',
      version: '1.0.0',
      devDependencies: {
        [packageName]: '^6.3.0',
      },
    });

    assert.deepEqual(resolveCurrentPumukiDependency(repoRoot), {
      source: 'devDependencies',
      spec: '^6.3.0',
    });
  });
});

test('hasDeclaredDependenciesBeyondPumuki ignora pumuki y pumuki-ast-hooks', async () => {
  await withTempDir('pumuki-consumer-package-ignore-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    writePackageJson(repoRoot, {
      name: 'fixture',
      version: '1.0.0',
      dependencies: {
        [packageName]: '6.3.11',
        'pumuki-ast-hooks': '6.3.7',
      },
      optionalDependencies: {
        [packageName]: '6.3.11',
      },
      peerDependencies: {
        'pumuki-ast-hooks': '6.3.7',
      },
    });

    assert.equal(hasDeclaredDependenciesBeyondPumuki(repoRoot), false);
  });
});

test('hasDeclaredDependenciesBeyondPumuki detecta dependencias de terceros en cualquier sección', async () => {
  await withTempDir('pumuki-consumer-package-external-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    writePackageJson(repoRoot, {
      name: 'fixture',
      version: '1.0.0',
      dependencies: {
        [packageName]: '6.3.11',
      },
      peerDependencies: {
        react: '^19.0.0',
      },
    });

    assert.equal(hasDeclaredDependenciesBeyondPumuki(repoRoot), true);
  });
});

test('resolveCurrentPumukiDependency ignora optionalDependencies y peerDependencies', async () => {
  await withTempDir('pumuki-consumer-package-optional-peer-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    writePackageJson(repoRoot, {
      name: 'fixture',
      version: '1.0.0',
      optionalDependencies: {
        [packageName]: '6.3.11',
      },
      peerDependencies: {
        [packageName]: '^6.0.0',
      },
    });

    assert.deepEqual(resolveCurrentPumukiDependency(repoRoot), { source: 'none' });
  });
});

test('hasDeclaredDependenciesBeyondPumuki detecta terceros en optionalDependencies', async () => {
  await withTempDir('pumuki-consumer-package-optional-external-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    writePackageJson(repoRoot, {
      name: 'fixture',
      version: '1.0.0',
      optionalDependencies: {
        [packageName]: '6.3.11',
        chokidar: '^4.0.0',
      },
    });

    assert.equal(hasDeclaredDependenciesBeyondPumuki(repoRoot), true);
  });
});

test('hasDeclaredDependenciesBeyondPumuki ignora alias legacy pumuki-ast-hooks también en devDependencies', async () => {
  await withTempDir('pumuki-consumer-package-legacy-devdeps-', async (repoRoot) => {
    writePackageJson(repoRoot, {
      name: 'fixture',
      version: '1.0.0',
      devDependencies: {
        'pumuki-ast-hooks': '^6.3.0',
      },
    });

    assert.equal(hasDeclaredDependenciesBeyondPumuki(repoRoot), false);
  });
});
