const { runBackendIntelligence } = require('../ast-backend');

describe('AST Backend Module', () => {
  describe('runBackendIntelligence', () => {
    it('should be a function', () => {
      expect(typeof runBackendIntelligence).toBe('function');
    });

    it('should be callable', () => {
      expect(runBackendIntelligence).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export runBackendIntelligence', () => {
      const mod = require('../ast-backend');
      expect(mod.runBackendIntelligence).toBeDefined();
    });
  });
});
