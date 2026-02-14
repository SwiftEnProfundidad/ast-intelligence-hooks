const AstAnalyzerAdapter = require('../AstAnalyzerAdapter');

describe('AstAnalyzerAdapter', () => {
  describe('constructor', () => {
    it('should be a class', () => {
      expect(typeof AstAnalyzerAdapter).toBe('function');
    });

    it('should initialize with default config', () => {
      const adapter = new AstAnalyzerAdapter();
      expect(adapter.repoRoot).toBeDefined();
      expect(adapter.astModulesPath).toBeDefined();
    });

    it('should have ignored patterns', () => {
      const adapter = new AstAnalyzerAdapter();
      expect(adapter.ignoredPatterns).toBeDefined();
      expect(Array.isArray(adapter.ignoredPatterns)).toBe(true);
    });

    it('should accept custom config', () => {
      const adapter = new AstAnalyzerAdapter({ repoRoot: '/custom/path' });
      expect(adapter.repoRoot).toBe('/custom/path');
    });
  });

  describe('exports', () => {
    it('should export AstAnalyzerAdapter class', () => {
      expect(AstAnalyzerAdapter).toBeDefined();
    });
  });
});
