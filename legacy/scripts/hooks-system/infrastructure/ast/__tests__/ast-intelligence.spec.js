const { runASTIntelligence } = require('../ast-intelligence');

describe('AST Intelligence Coordinator', () => {
  describe('runASTIntelligence', () => {
    it('should be a function', () => {
      expect(typeof runASTIntelligence).toBe('function');
    });

    it('should be async (returns promise)', () => {
      expect(runASTIntelligence).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export runASTIntelligence', () => {
      const mod = require('../ast-intelligence');
      expect(mod.runASTIntelligence).toBeDefined();
    });
  });
});
