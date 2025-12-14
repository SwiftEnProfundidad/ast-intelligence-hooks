const { StabilityAnalyzer } = require('../stability-analyzer');

function makeSUT() {
  return new StabilityAnalyzer();
}

function createViolation(ruleId, message = '') {
  return {
    ruleId,
    message,
  };
}

function createContext(overrides = {}) {
  return {
    valueCanBeNil: false,
    criticalPath: false,
    isSharedState: false,
    isMultiStepOperation: false,
    ...overrides,
  };
}

describe('StabilityAnalyzer', () => {
  describe('analyze', () => {
    it('should return score capped at 100', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule');
      const context = createContext();
      const score = analyzer.analyze(violation, context);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should aggregate scores from all analyzers', () => {
      const analyzer = makeSUT();
      const violation = createViolation('force_unwrap.violation');
      const context = createContext({ valueCanBeNil: true });
      const score = analyzer.analyze(violation, context);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('analyzeCrashRisk', () => {
    it('should score force unwrap violations based on nil possibility', () => {
      const analyzer = makeSUT();
      const violation = createViolation('force_unwrap.violation');
      const nilPossibleContext = createContext({ valueCanBeNil: true });
      const nilImpossibleContext = createContext({ valueCanBeNil: false });
      expect(analyzer.analyzeCrashRisk(violation, nilPossibleContext)).toBe(50);
      expect(analyzer.analyzeCrashRisk(violation, nilImpossibleContext)).toBe(30);
    });

    it('should score empty catch violations based on critical path', () => {
      const analyzer = makeSUT();
      const violation = createViolation('empty_catch.violation');
      const criticalContext = createContext({ criticalPath: true });
      const normalContext = createContext();
      expect(analyzer.analyzeCrashRisk(violation, criticalContext)).toBe(45);
      expect(analyzer.analyzeCrashRisk(violation, normalContext)).toBe(25);
    });

    it('should score force try violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('force_try.violation');
      const context = createContext();
      expect(analyzer.analyzeCrashRisk(violation, context)).toBe(40);
    });

    it('should score index out of bounds violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('index.bounds.violation');
      const context = createContext();
      expect(analyzer.analyzeCrashRisk(violation, context)).toBe(35);
    });

    it('should score division by zero violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', 'division by zero');
      const context = createContext();
      expect(analyzer.analyzeCrashRisk(violation, context)).toBe(35);
    });
  });

  describe('analyzeDataCorruptionRisk', () => {
    it('should score race condition violations based on shared state', () => {
      const analyzer = makeSUT();
      const violation = createViolation('race.violation');
      const sharedStateContext = createContext({ isSharedState: true });
      const normalContext = createContext();
      expect(analyzer.analyzeDataCorruptionRisk(violation, sharedStateContext)).toBe(30);
      expect(analyzer.analyzeDataCorruptionRisk(violation, normalContext)).toBe(15);
    });

    it('should score missing transaction violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('transaction.violation');
      const multiStepContext = createContext({ isMultiStepOperation: true });
      const normalContext = createContext();
      expect(analyzer.analyzeDataCorruptionRisk(violation, multiStepContext)).toBe(25);
      expect(analyzer.analyzeDataCorruptionRisk(violation, normalContext)).toBe(0);
    });

    it('should score invariant violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('invariant.violation');
      const context = createContext();
      expect(analyzer.analyzeDataCorruptionRisk(violation, context)).toBe(20);
    });

    it('should score direct mutation violations on shared state', () => {
      const analyzer = makeSUT();
      const violation = createViolation('direct_mutation.violation');
      const sharedStateContext = createContext({ isSharedState: true });
      const normalContext = createContext();
      expect(analyzer.analyzeDataCorruptionRisk(violation, sharedStateContext)).toBe(25);
      expect(analyzer.analyzeDataCorruptionRisk(violation, normalContext)).toBe(0);
    });
  });

  describe('analyzeUndefinedBehavior', () => {
    it('should score LSP violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('lsp.violation');
      const context = createContext();
      expect(analyzer.analyzeUndefinedBehavior(violation, context)).toBe(20);
    });

    it('should score untyped catch violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('untyped_catch.violation');
      const context = createContext();
      expect(analyzer.analyzeUndefinedBehavior(violation, context)).toBe(15);
    });

    it('should score undefined behavior violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('undefined.violation');
      const context = createContext();
      expect(analyzer.analyzeUndefinedBehavior(violation, context)).toBe(18);
    });
  });
});

