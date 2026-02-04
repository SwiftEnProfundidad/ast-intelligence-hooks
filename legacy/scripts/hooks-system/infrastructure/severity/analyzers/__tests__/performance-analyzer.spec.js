const { PerformanceAnalyzer } = require('../performance-analyzer');

function makeSUT() {
  return new PerformanceAnalyzer();
}

function createViolation(ruleId, message = '', metrics = {}) {
  return {
    ruleId,
    message,
    metrics,
  };
}

function createContext(overrides = {}) {
  return {
    isMainThread: false,
    callFrequency: 0,
    inHotPath: false,
    dataSize: 0,
    listSize: 0,
    ...overrides,
  };
}

describe('PerformanceAnalyzer', () => {
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
      const violation = createViolation('ui_on_background.violation', 'network request');
      const context = createContext({ isMainThread: true });
      const score = analyzer.analyze(violation, context);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('analyzeUIThreadBlocking', () => {
    it('should score UI blocking violations based on duration', () => {
      const analyzer = makeSUT();
      const violation = createViolation('ui_on_background.violation', 'network request');
      const context = createContext({ isMainThread: true });
      expect(analyzer.analyzeUIThreadBlocking(violation, context)).toBe(40);
    });

    it('should score sync network operations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('sync.network.violation');
      const context = createContext();
      expect(analyzer.analyzeUIThreadBlocking(violation, context)).toBe(35);
    });

    it('should return 0 for non-blocking violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('unrelated.rule');
      const context = createContext();
      expect(analyzer.analyzeUIThreadBlocking(violation, context)).toBe(0);
    });
  });

  describe('estimateBlockingDuration', () => {
    it('should estimate network operations duration', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', 'network request');
      expect(analyzer.estimateBlockingDuration(violation)).toBe(1000);
    });

    it('should estimate database operations duration', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', 'database query');
      expect(analyzer.estimateBlockingDuration(violation)).toBe(50);
    });

    it('should estimate file operations duration', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', 'file read');
      expect(analyzer.estimateBlockingDuration(violation)).toBe(30);
    });

    it('should estimate computation duration', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', 'computation algorithm');
      expect(analyzer.estimateBlockingDuration(violation)).toBe(20);
    });

    it('should return default duration for unknown operations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', 'unknown operation');
      expect(analyzer.estimateBlockingDuration(violation)).toBe(10);
    });
  });

  describe('analyzeMemoryImpact', () => {
    it('should score retain cycle violations based on call frequency', () => {
      const analyzer = makeSUT();
      const violation = createViolation('retain_cycle.violation');
      const highFrequencyContext = createContext({ callFrequency: 150 });
      const lowFrequencyContext = createContext({ callFrequency: 50 });
      expect(analyzer.analyzeMemoryImpact(violation, highFrequencyContext)).toBe(30);
      expect(analyzer.analyzeMemoryImpact(violation, lowFrequencyContext)).toBe(20);
    });

    it('should score cancellable violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('cancellable.violation');
      const context = createContext();
      expect(analyzer.analyzeMemoryImpact(violation, context)).toBe(25);
    });

    it('should score context leak violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('context_leak.violation');
      const context = createContext();
      expect(analyzer.analyzeMemoryImpact(violation, context)).toBe(25);
    });

    it('should score allocation violations in hot path', () => {
      const analyzer = makeSUT();
      const violation = createViolation('allocation.violation');
      const hotPathContext = createContext({ inHotPath: true });
      const normalContext = createContext({ inHotPath: false });
      expect(analyzer.analyzeMemoryImpact(violation, hotPathContext)).toBe(15);
      expect(analyzer.analyzeMemoryImpact(violation, normalContext)).toBe(0);
    });
  });

  describe('analyzeAlgorithmicComplexity', () => {
    it('should score N+1 query violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('n_plus_one.violation');
      const context = createContext();
      expect(analyzer.analyzeAlgorithmicComplexity(violation, context)).toBe(20);
    });

    it('should score nested loops violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule', '', { nestedLoops: 3 });
      const context = createContext();
      expect(analyzer.analyzeAlgorithmicComplexity(violation, context)).toBe(18);
    });

    it('should score missing pagination for large datasets', () => {
      const analyzer = makeSUT();
      const violation = createViolation('pagination.violation');
      const largeDatasetContext = createContext({ dataSize: 2000 });
      const smallDatasetContext = createContext({ dataSize: 100 });
      expect(analyzer.analyzeAlgorithmicComplexity(violation, largeDatasetContext)).toBe(15);
      expect(analyzer.analyzeAlgorithmicComplexity(violation, smallDatasetContext)).toBe(0);
    });
  });

  describe('analyzeMissingOptimizations', () => {
    it('should score missing memoization based on call frequency', () => {
      const analyzer = makeSUT();
      const violation = createViolation('memo.violation');
      const highFrequencyContext = createContext({ callFrequency: 150 });
      const lowFrequencyContext = createContext({ callFrequency: 50 });
      expect(analyzer.analyzeMissingOptimizations(violation, highFrequencyContext)).toBe(10);
      expect(analyzer.analyzeMissingOptimizations(violation, lowFrequencyContext)).toBe(3);
    });

    it('should score missing virtualization for large lists', () => {
      const analyzer = makeSUT();
      const violation = createViolation('virtualization.violation');
      const largeListContext = createContext({ listSize: 2000 });
      const smallListContext = createContext({ listSize: 100 });
      expect(analyzer.analyzeMissingOptimizations(violation, largeListContext)).toBe(8);
      expect(analyzer.analyzeMissingOptimizations(violation, smallListContext)).toBe(2);
    });

    it('should score missing code splitting', () => {
      const analyzer = makeSUT();
      const violation = createViolation('code_splitting.violation');
      const context = createContext();
      expect(analyzer.analyzeMissingOptimizations(violation, context)).toBe(4);
    });
  });
});

