const {
  analyzeSRP,
  analyzeOCP,
  analyzeLSP,
  analyzeISP,
  analyzeDIP
} = require('../solid-analyzer');

function createMockClass(config = {}) {
  return {
    getName: () => config.name || 'TestClass',
    getMethods: () => config.methods || [],
    getProperties: () => config.properties || [],
    getConstructors: () => config.constructors || [],
    getImplements: () => config.implements || [],
    getExtends: () => config.extends || null
  };
}

function createMockSourceFile(config = {}) {
  return {
    getFilePath: () => config.path || '/app/service.ts',
    getFullText: () => config.content || '',
    getImportDeclarations: () => config.imports || []
  };
}

function createMockPushFinding() {
  return jest.fn();
}

describe('solid-analyzer', () => {
  describe('analyzeSRP', () => {
    it('should be a function', () => {
      expect(typeof analyzeSRP).toBe('function');
    });

    it('should not throw for class with no methods', () => {
      const cls = createMockClass({ methods: [] });
      const sf = createMockSourceFile();
      const findings = [];
      const pushFinding = createMockPushFinding();

      expect(() => analyzeSRP(cls, sf, findings, pushFinding)).not.toThrow();
    });

    it('should not flag small cohesive class', () => {
      const cls = createMockClass({
        name: 'UserService',
        methods: [{ getName: () => 'getUser' }],
        properties: []
      });
      const sf = createMockSourceFile();
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeSRP(cls, sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalledWith(
        'solid.srp.violation',
        'critical',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('analyzeOCP', () => {
    it('should be a function', () => {
      expect(typeof analyzeOCP).toBe('function');
    });

    it('should not throw for empty class', () => {
      const cls = createMockClass();
      const sf = createMockSourceFile();
      const findings = [];
      const pushFinding = createMockPushFinding();

      expect(() => analyzeOCP(cls, sf, findings, pushFinding)).not.toThrow();
    });
  });

  describe('analyzeLSP', () => {
    it('should be a function', () => {
      expect(typeof analyzeLSP).toBe('function');
    });
  });

  describe('analyzeISP', () => {
    it('should be a function', () => {
      expect(typeof analyzeISP).toBe('function');
    });
  });

  describe('analyzeDIP', () => {
    it('should be a function', () => {
      expect(typeof analyzeDIP).toBe('function');
    });
  });

  describe('exports', () => {
    it('should export all SOLID analyzers', () => {
      const solidModule = require('../solid-analyzer');

      expect(solidModule.analyzeSRP).toBeDefined();
      expect(solidModule.analyzeOCP).toBeDefined();
      expect(solidModule.analyzeLSP).toBeDefined();
      expect(solidModule.analyzeISP).toBeDefined();
      expect(solidModule.analyzeDIP).toBeDefined();
    });
  });
});
