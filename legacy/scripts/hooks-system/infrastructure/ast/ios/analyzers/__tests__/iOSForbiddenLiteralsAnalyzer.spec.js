const { iOSForbiddenLiteralsAnalyzer } = require('../iOSForbiddenLiteralsAnalyzer');

describe('iOSForbiddenLiteralsAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new iOSForbiddenLiteralsAnalyzer();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(analyzer).toBeInstanceOf(iOSForbiddenLiteralsAnalyzer);
    });
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
    it('should export iOSForbiddenLiteralsAnalyzer', () => {
      const mod = require('../iOSForbiddenLiteralsAnalyzer');
      expect(mod.iOSForbiddenLiteralsAnalyzer).toBeDefined();
    });
  });
});
