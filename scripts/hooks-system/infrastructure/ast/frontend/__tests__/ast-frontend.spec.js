const { runFrontendIntelligence } = require('../ast-frontend');

describe('AST Frontend Module', () => {
  describe('runFrontendIntelligence', () => {
    it('should be a function', () => {
      expect(typeof runFrontendIntelligence).toBe('function');
    });

    it('should be callable', () => {
      expect(runFrontendIntelligence).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export runFrontendIntelligence', () => {
      const mod = require('../ast-frontend');
      expect(mod.runFrontendIntelligence).toBeDefined();
    });
  });
});
