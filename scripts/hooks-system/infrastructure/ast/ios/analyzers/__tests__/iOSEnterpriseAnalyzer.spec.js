const { iOSEnterpriseAnalyzer } = require('../iOSEnterpriseAnalyzer');

describe('iOSEnterpriseAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new iOSEnterpriseAnalyzer();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(analyzer).toBeInstanceOf(iOSEnterpriseAnalyzer);
    });

    it('should initialize findings array', () => {
      expect(analyzer.findings).toEqual([]);
    });

    it('should initialize parser', () => {
      expect(analyzer.parser).toBeDefined();
    });
  });

  describe('analyzeFile', () => {
    it('should be an async method', () => {
      expect(typeof analyzer.analyzeFile).toBe('function');
    });
  });

  describe('exports', () => {
    it('should export iOSEnterpriseAnalyzer', () => {
      const mod = require('../iOSEnterpriseAnalyzer');
      expect(mod.iOSEnterpriseAnalyzer).toBeDefined();
    });
  });
});
