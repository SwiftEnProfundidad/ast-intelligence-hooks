const { runCommonIntelligence } = require('../ast-common');

describe('AST Common Module', () => {
  describe('runCommonIntelligence', () => {
    it('should be a function', () => {
      expect(typeof runCommonIntelligence).toBe('function');
    });

    it('should be callable', () => {
      expect(runCommonIntelligence).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export runCommonIntelligence', () => {
      const mod = require('../ast-common');
      expect(mod.runCommonIntelligence).toBeDefined();
    });
  });
});
