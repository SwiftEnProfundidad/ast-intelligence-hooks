const { iOSPerformanceRules } = require('../iOSPerformanceRules');

describe('iOSPerformanceRules', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new iOSPerformanceRules([]);
  });

  describe('constructor', () => {
    it('should create instance with findings', () => {
      const findings = [];
      const rules = new iOSPerformanceRules(findings);
      expect(rules.findings).toBe(findings);
    });
  });

  describe('analyzeFile', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeFile).toBe('function');
    });

    it('should not throw for valid input', () => {
      expect(() => analyzer.analyzeFile('/app/test.swift', 'let x = 1')).not.toThrow();
    });
  });

  describe('exports', () => {
    it('should export iOSPerformanceRules', () => {
      const mod = require('../iOSPerformanceRules');
      expect(mod.iOSPerformanceRules).toBeDefined();
    });
  });
});
