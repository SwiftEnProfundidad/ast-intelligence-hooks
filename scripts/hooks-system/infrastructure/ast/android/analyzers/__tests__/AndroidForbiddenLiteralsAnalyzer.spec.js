const { AndroidForbiddenLiteralsAnalyzer } = require('../AndroidForbiddenLiteralsAnalyzer');

describe('AndroidForbiddenLiteralsAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new AndroidForbiddenLiteralsAnalyzer();
  });

  describe('analyze', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyze).toBe('function');
    });
  });

  describe('analyzeStringLiterals', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeStringLiterals).toBe('function');
    });
  });

  describe('analyzeNumericLiterals', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeNumericLiterals).toBe('function');
    });
  });

  describe('analyzeTypeCasts', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeTypeCasts).toBe('function');
    });
  });

  describe('analyzeNullishCoalescing', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeNullishCoalescing).toBe('function');
    });
  });

  describe('analyzeConditionalExpressions', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeConditionalExpressions).toBe('function');
    });
  });

  describe('analyzeObjectLiterals', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeObjectLiterals).toBe('function');
    });
  });

  describe('exports', () => {
    it('should export AndroidForbiddenLiteralsAnalyzer', () => {
      const mod = require('../AndroidForbiddenLiteralsAnalyzer');
      expect(mod.AndroidForbiddenLiteralsAnalyzer).toBeDefined();
    });
  });
});
