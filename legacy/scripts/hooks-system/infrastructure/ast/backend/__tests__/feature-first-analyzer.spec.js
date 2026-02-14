const { analyzeFeatureFirst } = require('../feature-first-analyzer');

function createMockSourceFile(config = {}) {
  return {
    getFilePath: () => config.path || '/app/src/features/users/users.service.ts',
    getFullText: () => config.content || '',
    getImportDeclarations: () => config.imports || []
  };
}

function createMockImport(modulePath) {
  return {
    getModuleSpecifierValue: () => modulePath,
    getStartLineNumber: () => 1
  };
}

function createMockPushFinding() {
  return jest.fn();
}

describe('feature-first-analyzer', () => {
  describe('analyzeFeatureFirst', () => {
    it('should be a function', () => {
      expect(typeof analyzeFeatureFirst).toBe('function');
    });

    it('should skip files not in a feature', () => {
      const sf = createMockSourceFile({
        path: '/app/src/main.ts',
        imports: []
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeFeatureFirst(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalled();
    });

    it('should allow imports from core modules', () => {
      const sf = createMockSourceFile({
        path: '/app/src/features/users/users.service.ts',
        imports: [createMockImport('../core/database')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeFeatureFirst(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalledWith(
        'backend.feature.cross_feature_import',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should allow imports from common modules', () => {
      const sf = createMockSourceFile({
        path: '/app/src/features/orders/orders.service.ts',
        imports: [createMockImport('../common/utils')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeFeatureFirst(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalledWith(
        'backend.feature.cross_feature_import',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should allow imports from shared modules', () => {
      const sf = createMockSourceFile({
        path: '/app/src/features/products/products.service.ts',
        imports: [createMockImport('../shared/types')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeFeatureFirst(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalledWith(
        'backend.feature.cross_feature_import',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should allow same-feature imports', () => {
      const sf = createMockSourceFile({
        path: '/app/src/features/users/users.controller.ts',
        imports: [createMockImport('./users.service')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeFeatureFirst(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalledWith(
        'backend.feature.cross_feature_import',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('exports', () => {
    it('should export analyzeFeatureFirst', () => {
      const mod = require('../feature-first-analyzer');
      expect(mod.analyzeFeatureFirst).toBeDefined();
    });
  });
});
