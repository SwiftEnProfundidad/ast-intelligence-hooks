const { AndroidSOLIDAnalyzer } = require('../AndroidSOLIDAnalyzer');

describe('AndroidSOLIDAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new AndroidSOLIDAnalyzer();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(analyzer).toBeInstanceOf(AndroidSOLIDAnalyzer);
    });

    it('should initialize findings array', () => {
      expect(analyzer.findings).toEqual([]);
    });
  });

  describe('analyze', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyze).toBe('function');
    });
  });

  describe('analyzeOCP', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeOCP).toBe('function');
    });
  });

  describe('analyzeDIP', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeDIP).toBe('function');
    });
  });

  describe('analyzeSRP', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeSRP).toBe('function');
    });
  });

  describe('analyzeISP', () => {
    it('should be a method', () => {
      expect(typeof analyzer.analyzeISP).toBe('function');
    });
  });

  describe('detectMethodConcern', () => {
    it('should detect data-access concern', () => {
      expect(analyzer.detectMethodConcern('getUser')).toBe('data-access');
      expect(analyzer.detectMethodConcern('fetchData')).toBe('data-access');
    });

    it('should detect data-mutation concern', () => {
      expect(analyzer.detectMethodConcern('setUser')).toBe('data-mutation');
      expect(analyzer.detectMethodConcern('deleteItem')).toBe('data-mutation');
    });

    it('should detect validation concern', () => {
      expect(analyzer.detectMethodConcern('validateEmail')).toBe('validation');
    });

    it('should detect transformation concern', () => {
      expect(analyzer.detectMethodConcern('formatDate')).toBe('transformation');
    });

    it('should detect rendering concern', () => {
      expect(analyzer.detectMethodConcern('renderItem')).toBe('rendering');
    });

    it('should return unknown for unrecognized methods', () => {
      expect(analyzer.detectMethodConcern('doSomething')).toBe('unknown');
    });
  });

  describe('exports', () => {
    it('should export AndroidSOLIDAnalyzer', () => {
      const mod = require('../AndroidSOLIDAnalyzer');
      expect(mod.AndroidSOLIDAnalyzer).toBeDefined();
    });
  });
});
