const IntelligentCommitAnalyzer = require('../IntelligentCommitAnalyzer');

function makeSUT(options = {}) {
  return new IntelligentCommitAnalyzer(options);
}

describe('IntelligentCommitAnalyzer', () => {
  describe('constructor', () => {
    it('should initialize with default repoRoot and logger', () => {
      const analyzer = makeSUT();
      expect(analyzer.repoRoot).toBe(process.cwd());
      expect(analyzer.logger).toBe(console);
    });

    it('should initialize with custom options', () => {
      const customRoot = '/custom/repo';
      const customLogger = { log: jest.fn() };
      const analyzer = makeSUT({ repoRoot: customRoot, logger: customLogger });
      expect(analyzer.repoRoot).toBe(customRoot);
      expect(analyzer.logger).toBe(customLogger);
    });
  });

  describe('detectFeature', () => {
    it('should return null for deleted files', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature(' D file.ts')).toBeNull();
      expect(analyzer.detectFeature('file.ts (deleted)')).toBeNull();
    });

    it('should return null for config files', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('package.json')).toBeNull();
      expect(analyzer.detectFeature('tsconfig.json')).toBeNull();
    });

    it('should return null for build artifacts', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('bin/script.js')).toBeNull();
      expect(analyzer.detectFeature('dist/app.js')).toBeNull();
      expect(analyzer.detectFeature('build/output.o')).toBeNull();
    });

    it('should detect backend features', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('apps/backend/src/orders/OrderService.ts')).toBe('orders');
      expect(analyzer.detectFeature('apps/backend/src/users/UserController.ts')).toBe('users');
    });

    it('should detect frontend features', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('apps/admin-dashboard/src/dashboard/Dashboard.tsx')).toBe('dashboard');
      expect(analyzer.detectFeature('apps/web-app/src/auth/Login.tsx')).toBe('auth');
    });

    it('should detect iOS features', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('apps/ios/Orders/OrderView.swift')).toBe('Orders');
    });

    it('should detect Android features', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('apps/android/feature/orders/OrderViewModel.kt')).toBe('orders');
    });

    it('should detect hooks-system feature', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('scripts/hooks-system/infrastructure/ast.js')).toBe('hooks-system');
    });

    it('should detect docs feature', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('docs/README.md')).toBe('docs');
    });

    it('should return null for hidden directories', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectFeature('.github/workflows/ci.yml')).toBeNull();
      expect(analyzer.detectFeature('.vscode/settings.json')).toBeNull();
      expect(analyzer.detectFeature('.cursor/rules.md')).toBeNull();
    });
  });

  describe('detectModule', () => {
    it('should detect domain module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/domain/entities/Order.ts')).toBe('domain');
    });

    it('should detect application module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/application/use-cases/CreateOrder.ts')).toBe('application');
    });

    it('should detect infrastructure module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/infrastructure/database/OrderRepository.ts')).toBe('infrastructure');
    });

    it('should detect presentation module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/presentation/controllers/OrderController.ts')).toBe('presentation');
    });

    it('should detect data module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/data/models/Order.ts')).toBe('data');
    });

    it('should detect ui module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/ui/components/Button.tsx')).toBe('ui');
    });

    it('should detect hooks module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/hooks/pre-commit.js')).toBe('hooks');
      expect(analyzer.detectModule('scripts/hooks-system/hooks/pre-commit.js')).toBe('hooks');
    });

    it('should detect components module', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('src/components/Button.tsx')).toBe('components');
      expect(analyzer.detectModule('apps/frontend/src/components/Button.tsx')).toBe('components');
    });

    it('should return root for files without module path', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectModule('README.md')).toBe('root');
    });
  });

  describe('detectPlatform', () => {
    it('should detect backend platform', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectPlatform('apps/backend/src/orders.ts')).toBe('backend');
    });

    it('should detect frontend platform for admin-dashboard', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectPlatform('apps/admin-dashboard/src/app.tsx')).toBe('frontend');
    });

    it('should detect frontend platform for web-app', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectPlatform('apps/web-app/src/index.tsx')).toBe('frontend');
    });

    it('should detect iOS platform', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectPlatform('apps/ios/Orders/OrderView.swift')).toBe('ios');
    });

    it('should detect Android platform', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectPlatform('apps/android/feature/orders/OrderViewModel.kt')).toBe('android');
    });

    it('should return shared for other paths', () => {
      const analyzer = makeSUT();
      expect(analyzer.detectPlatform('shared/utils.ts')).toBe('shared');
      expect(analyzer.detectPlatform('README.md')).toBe('shared');
    });
  });

  describe('isTestFile', () => {
    it('should detect test files by extension', () => {
      const analyzer = makeSUT();
      expect(analyzer.isTestFile('Order.test.ts')).toBe(true);
      expect(analyzer.isTestFile('Order.spec.ts')).toBe(true);
      expect(analyzer.isTestFile('Order.test.js')).toBe(true);
      expect(analyzer.isTestFile('Order.test.swift')).toBe(true);
      expect(analyzer.isTestFile('Order.test.kt')).toBe(true);
    });

    it('should detect test files by directory', () => {
      const analyzer = makeSUT();
      expect(analyzer.isTestFile('src/__tests__/Order.test.ts')).toBe(true);
      expect(analyzer.isTestFile('src/test/Order.test.ts')).toBe(true);
      expect(analyzer.isTestFile('src/tests/Order.test.ts')).toBe(true);
    });

    it('should return false for non-test files', () => {
      const analyzer = makeSUT();
      expect(analyzer.isTestFile('Order.ts')).toBe(false);
      expect(analyzer.isTestFile('Order.js')).toBe(false);
    });
  });

  describe('groupFilesByFeature', () => {
    it('should group files by feature and module', () => {
      const analyzer = makeSUT();
      const files = [
        'apps/backend/src/orders/OrderService.ts',
        'apps/backend/src/orders/OrderRepository.ts',
      ];
      const groups = analyzer.groupFilesByFeature(files);
      expect(groups).toHaveLength(1);
      expect(groups[0].feature).toBe('orders');
      expect(groups[0].module).toBe('root');
      expect(groups[0].files).toHaveLength(2);
    });

    it('should filter out groups with less than 2 files', () => {
      const analyzer = makeSUT();
      const files = [
        'apps/backend/src/orders/OrderService.ts',
      ];
      const groups = analyzer.groupFilesByFeature(files);
      expect(groups).toHaveLength(0);
    });

    it('should detect test files in group', () => {
      const analyzer = makeSUT();
      const files = [
        'apps/backend/src/orders/OrderService.ts',
        'apps/backend/src/orders/__tests__/OrderService.spec.ts',
      ];
      const groups = analyzer.groupFilesByFeature(files);
      expect(groups[0].hasTests).toBe(true);
      expect(groups[0].hasImplementation).toBe(true);
    });

    it('should separate different features', () => {
      const analyzer = makeSUT();
      const files = [
        'apps/backend/src/orders/OrderService.ts',
        'apps/backend/src/orders/OrderRepository.ts',
        'apps/backend/src/users/UserService.ts',
        'apps/backend/src/users/UserRepository.ts',
      ];
      const groups = analyzer.groupFilesByFeature(files);
      expect(groups).toHaveLength(2);
    });

    it('should ignore ungrouped files', () => {
      const analyzer = makeSUT();
      const files = [
        'apps/backend/src/orders/OrderService.ts',
        'apps/backend/src/orders/OrderRepository.ts',
        'package.json',
        '.github/workflows/ci.yml',
      ];
      const groups = analyzer.groupFilesByFeature(files);
      expect(groups).toHaveLength(1);
    });
  });

  describe('generateCommitMessage', () => {
    it('should generate feat message when tests included', () => {
      const analyzer = makeSUT();
      const group = {
        feature: 'orders',
        module: 'domain',
        platform: 'backend',
        hasTests: true,
      };
      const message = analyzer.generateCommitMessage(group);
      expect(message).toContain('feat(backend)');
      expect(message).toContain('orders');
      expect(message).toContain('includes tests');
    });

    it('should generate chore message when no tests', () => {
      const analyzer = makeSUT();
      const group = {
        feature: 'orders',
        module: 'domain',
        platform: 'backend',
        hasTests: false,
      };
      const message = analyzer.generateCommitMessage(group);
      expect(message).toContain('chore(backend)');
      expect(message).not.toContain('includes tests');
    });

    it('should use shared platform when platform is shared', () => {
      const analyzer = makeSUT();
      const group = {
        feature: 'utils',
        module: 'shared',
        platform: 'shared',
        hasTests: false,
      };
      const message = analyzer.generateCommitMessage(group);
      expect(message).not.toContain('(shared)');
    });
  });

  describe('analyzeAndSuggestCommits', () => {
    it('should return suggestions for grouped files', async () => {
      const analyzer = makeSUT();
      const files = [
        'apps/backend/src/orders/OrderService.ts',
        'apps/backend/src/orders/OrderRepository.ts',
      ];
      const suggestions = await analyzer.analyzeAndSuggestCommits(files);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].feature).toBe('orders');
      expect(suggestions[0].fileCount).toBe(2);
      expect(suggestions[0].commitMessage).toBeDefined();
    });

    it('should return empty array for ungrouped files', async () => {
      const analyzer = makeSUT();
      const files = [
        'package.json',
      ];
      const suggestions = await analyzer.analyzeAndSuggestCommits(files);
      expect(suggestions).toHaveLength(0);
    });

    it('should include hasTests flag in suggestions', async () => {
      const analyzer = makeSUT();
      const files = [
        'apps/backend/src/orders/OrderService.ts',
        'apps/backend/src/orders/__tests__/OrderService.spec.ts',
      ];
      const suggestions = await analyzer.analyzeAndSuggestCommits(files);
      expect(suggestions[0].hasTests).toBe(true);
    });
  });

  describe('getReadyCommits', () => {
    it('should return all suggestions as ready', () => {
      const analyzer = makeSUT();
      const suggestions = [
        { feature: 'orders', fileCount: 2 },
        { feature: 'users', fileCount: 3 },
      ];
      const ready = analyzer.getReadyCommits(suggestions);
      expect(ready).toEqual(suggestions);
    });
  });

  describe('getNeedsAttention', () => {
    it('should return empty array', () => {
      const analyzer = makeSUT();
      const suggestions = [
        { feature: 'orders', fileCount: 2 },
      ];
      const needsAttention = analyzer.getNeedsAttention(suggestions);
      expect(needsAttention).toEqual([]);
    });
  });

  describe('verifyTests', () => {
    it('should return disabled status', async () => {
      const analyzer = makeSUT();
      const result = await analyzer.verifyTests({});
      expect(result.passed).toBeNull();
      expect(result.reason).toBe('test verification disabled');
    });
  });

  describe('verifyBuild', () => {
    it('should return disabled status', async () => {
      const analyzer = makeSUT();
      const result = await analyzer.verifyBuild({});
      expect(result.built).toBeNull();
      expect(result.reason).toBe('build check disabled');
    });
  });
});

