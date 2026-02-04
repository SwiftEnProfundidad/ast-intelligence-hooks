const { MaintainabilityAnalyzer } = require('../maintainability-analyzer');

function makeSUT() {
  return new MaintainabilityAnalyzer();
}

function createViolation(ruleId, metrics = {}) {
  return {
    ruleId,
    message: 'Test violation',
    metrics,
  };
}

function createContext(overrides = {}) {
  return {
    dependencyCount: 0,
    criticalPath: false,
    hasBusinessLogic: false,
    ...overrides,
  };
}

describe('MaintainabilityAnalyzer', () => {
  describe('analyze', () => {
    it('should return score capped at 100', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', { cyclomaticComplexity: 100 });
      const context = createContext();
      const score = analyzer.analyze(violation, context);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should aggregate scores from all analyzers', () => {
      const analyzer = makeSUT();
      const violation = createViolation('dip.violation', {
        cyclomaticComplexity: 25,
        duplicateCount: 5,
      });
      const context = createContext({ dependencyCount: 15 });
      const score = analyzer.analyze(violation, context);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('analyzeCoupling', () => {
    it('should score DIP violations based on dependency count', () => {
      const analyzer = makeSUT();
      const violation = createViolation('dip.violation');
      const highDependencyContext = createContext({ dependencyCount: 15 });
      const lowDependencyContext = createContext({ dependencyCount: 5 });
      expect(analyzer.analyzeCoupling(violation, highDependencyContext)).toBe(30);
      expect(analyzer.analyzeCoupling(violation, lowDependencyContext)).toBe(20);
    });

    it('should score ISP violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('isp.violation');
      const context = createContext();
      expect(analyzer.analyzeCoupling(violation, context)).toBe(15);
    });

    it('should score prop drilling violations based on depth', () => {
      const analyzer = makeSUT();
      const deepViolation = createViolation('prop_drilling.violation', { propDrillingDepth: 7 });
      const shallowViolation = createViolation('prop_drilling.violation', { propDrillingDepth: 3 });
      const context = createContext();
      expect(analyzer.analyzeCoupling(deepViolation, context)).toBe(25);
      expect(analyzer.analyzeCoupling(shallowViolation, context)).toBe(10);
    });

    it('should return 0 for unrelated violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('unrelated.rule');
      const context = createContext();
      expect(analyzer.analyzeCoupling(violation, context)).toBe(0);
    });
  });

  describe('analyzeComplexity', () => {
    it('should score based on cyclomatic complexity', () => {
      const analyzer = makeSUT();
      const highComplexity = createViolation('test.rule', { cyclomaticComplexity: 25 });
      const mediumComplexity = createViolation('test.rule', { cyclomaticComplexity: 18 });
      const lowComplexity = createViolation('test.rule', { cyclomaticComplexity: 12 });
      const context = createContext();
      expect(analyzer.analyzeComplexity(highComplexity, context)).toBe(30);
      expect(analyzer.analyzeComplexity(mediumComplexity, context)).toBe(20);
      expect(analyzer.analyzeComplexity(lowComplexity, context)).toBe(10);
    });

    it('should score god class violations based on method count', () => {
      const analyzer = makeSUT();
      const largeClass = createViolation('god.class.violation', { methodCount: 35 });
      const mediumClass = createViolation('god.class.violation', { methodCount: 25 });
      const smallClass = createViolation('god.class.violation', { methodCount: 15 });
      const context = createContext();
      expect(analyzer.analyzeComplexity(largeClass, context)).toBe(30);
      expect(analyzer.analyzeComplexity(mediumClass, context)).toBe(20);
      expect(analyzer.analyzeComplexity(smallClass, context)).toBe(15);
    });

    it('should score nested code violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('nested.code.violation');
      const context = createContext();
      expect(analyzer.analyzeComplexity(violation, context)).toBe(25);
    });

    it('should score callback hell violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('callback_hell.violation');
      const context = createContext();
      expect(analyzer.analyzeComplexity(violation, context)).toBe(20);
    });
  });

  describe('analyzeDuplication', () => {
    it('should score based on duplicate count', () => {
      const analyzer = makeSUT();
      const manyDuplicates = createViolation('duplication.violation', { duplicateCount: 10 });
      const fewDuplicates = createViolation('duplication.violation', { duplicateCount: 2 });
      const context = createContext();
      expect(analyzer.analyzeDuplication(manyDuplicates, context)).toBe(20);
      expect(analyzer.analyzeDuplication(fewDuplicates, context)).toBe(10);
    });

    it('should cap duplicate score at 20', () => {
      const analyzer = makeSUT();
      const manyDuplicates = createViolation('duplication.violation', { duplicateCount: 100 });
      const context = createContext();
      expect(analyzer.analyzeDuplication(manyDuplicates, context)).toBe(20);
    });

    it('should score OCP violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('ocp.violation');
      const context = createContext();
      expect(analyzer.analyzeDuplication(violation, context)).toBe(15);
    });
  });

  describe('analyzeTestability', () => {
    it('should score missing tests based on context', () => {
      const analyzer = makeSUT();
      const violation = createViolation('missing_tests.violation');
      const criticalContext = createContext({ criticalPath: true });
      const businessLogicContext = createContext({ hasBusinessLogic: true });
      const normalContext = createContext();
      expect(analyzer.analyzeTestability(violation, criticalContext)).toBe(20);
      expect(analyzer.analyzeTestability(violation, businessLogicContext)).toBe(15);
      expect(analyzer.analyzeTestability(violation, normalContext)).toBe(5);
    });

    it('should score DIP violations affecting testability', () => {
      const analyzer = makeSUT();
      const violation = createViolation('dip.violation');
      const context = createContext();
      expect(analyzer.analyzeTestability(violation, context)).toBe(15);
    });

    it('should score mock in production violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('mock_in_production.violation');
      const context = createContext();
      expect(analyzer.analyzeTestability(violation, context)).toBe(18);
    });
  });
});

