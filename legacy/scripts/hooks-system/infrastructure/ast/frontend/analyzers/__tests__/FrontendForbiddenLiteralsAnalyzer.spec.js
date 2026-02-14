const { FrontendForbiddenLiteralsAnalyzer } = require('../FrontendForbiddenLiteralsAnalyzer');

describe('FrontendForbiddenLiteralsAnalyzer', () => {
  describe('module structure', () => {
    it('should export a class', () => {
      expect(FrontendForbiddenLiteralsAnalyzer).toBeDefined();
      expect(typeof FrontendForbiddenLiteralsAnalyzer).toBe('function');
    });

    it('should be instantiable', () => {
      const instance = new FrontendForbiddenLiteralsAnalyzer([]);
      expect(instance).toBeDefined();
    });

    it('should have analyze method', () => {
      const instance = new FrontendForbiddenLiteralsAnalyzer([]);
      expect(typeof instance.analyze).toBe('function');
    });
  });
});
