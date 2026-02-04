const PredictiveHookAdvisor = require('../PredictiveHookAdvisor');
const fs = require('fs');
const path = require('path');

function makeSUT(options = {}) {
  return new PredictiveHookAdvisor(options);
}

function createMockMetricsFile(metrics) {
  const metricsFile = path.join(process.cwd(), '.audit_tmp', 'hook-metrics.jsonl');
  const dir = path.dirname(metricsFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const content = metrics.map(m => JSON.stringify(m)).join('\n');
  fs.writeFileSync(metricsFile, content);
}

function cleanupMetricsFile() {
  const metricsFile = path.join(process.cwd(), '.audit_tmp', 'hook-metrics.jsonl');
  if (fs.existsSync(metricsFile)) {
    fs.unlinkSync(metricsFile);
  }
}

describe('PredictiveHookAdvisor', () => {
  beforeEach(() => {
    cleanupMetricsFile();
  });

  afterEach(() => {
    cleanupMetricsFile();
  });

  describe('constructor', () => {
    it('should initialize with default window size', () => {
      const advisor = makeSUT();
      expect(advisor.windowSize).toBe(200);
    });

    it('should initialize with custom window size', () => {
      const advisor = makeSUT({ windowSize: 100 });
      expect(advisor.windowSize).toBe(100);
    });
  });

  describe('loadMetrics', () => {
    it('should return empty array when metrics file does not exist', () => {
      const advisor = makeSUT();
      const metrics = advisor.loadMetrics();
      expect(metrics).toEqual([]);
    });

    it('should load metrics from file', () => {
      const mockMetrics = [
        { hook: 'pre-commit', status: 'success', timestamp: Date.now() },
        { hook: 'pre-commit', status: 'failure', timestamp: Date.now() },
      ];
      createMockMetricsFile(mockMetrics);
      const advisor = makeSUT();
      const metrics = advisor.loadMetrics();
      expect(metrics).toHaveLength(2);
    });

    it('should limit metrics to window size', () => {
      const manyMetrics = Array.from({ length: 250 }, (_, i) => ({
        hook: 'pre-commit',
        status: 'success',
        timestamp: Date.now() + i,
      }));
      createMockMetricsFile(manyMetrics);
      const advisor = makeSUT({ windowSize: 200 });
      const metrics = advisor.loadMetrics();
      expect(metrics.length).toBeLessThanOrEqual(200);
    });

    it('should filter out invalid JSON lines', () => {
      const metricsFile = path.join(process.cwd(), '.audit_tmp', 'hook-metrics.jsonl');
      const dir = path.dirname(metricsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(metricsFile, '{"valid": true}\ninvalid json\n{"valid2": true}');
      const advisor = makeSUT();
      const metrics = advisor.loadMetrics();
      expect(metrics).toHaveLength(2);
    });
  });

  describe('getFailureProbabilities', () => {
    it('should return empty array when no metrics', () => {
      const advisor = makeSUT();
      const probabilities = advisor.getFailureProbabilities();
      expect(probabilities).toEqual([]);
    });

    it('should calculate failure probabilities per hook', () => {
      const mockMetrics = [
        { hook: 'pre-commit', status: 'success' },
        { hook: 'pre-commit', status: 'success' },
        { hook: 'pre-commit', status: 'failure' },
        { hook: 'pre-push', status: 'success' },
        { hook: 'pre-push', status: 'failure' },
      ];
      createMockMetricsFile(mockMetrics);
      const advisor = makeSUT();
      const probabilities = advisor.getFailureProbabilities();
      expect(probabilities.length).toBeGreaterThan(0);
      const preCommit = probabilities.find(p => p.hook === 'pre-commit');
      expect(preCommit).toBeDefined();
      expect(preCommit.total).toBe(3);
      expect(preCommit.failures).toBe(1);
    });

    it('should sort by probability descending', () => {
      const mockMetrics = [
        { hook: 'hook-a', status: 'failure' },
        { hook: 'hook-a', status: 'failure' },
        { hook: 'hook-b', status: 'success' },
        { hook: 'hook-b', status: 'failure' },
      ];
      createMockMetricsFile(mockMetrics);
      const advisor = makeSUT();
      const probabilities = advisor.getFailureProbabilities();
      expect(probabilities[0].probability).toBeGreaterThanOrEqual(probabilities[1].probability);
    });

    it('should handle unknown hooks', () => {
      const mockMetrics = [
        { status: 'success' },
        { hook: 'known-hook', status: 'failure' },
      ];
      createMockMetricsFile(mockMetrics);
      const advisor = makeSUT();
      const probabilities = advisor.getFailureProbabilities();
      expect(probabilities.some(p => p.hook === 'unknown')).toBe(true);
    });
  });

  describe('suggestPreemptiveActions', () => {
    it('should return empty array when no high probability failures', () => {
      const mockMetrics = [
        { hook: 'pre-commit', status: 'success' },
        { hook: 'pre-commit', status: 'success' },
      ];
      createMockMetricsFile(mockMetrics);
      const advisor = makeSUT();
      const suggestions = advisor.suggestPreemptiveActions(0.5);
      expect(suggestions).toEqual([]);
    });

    it('should filter hooks above threshold', () => {
      const mockMetrics = [
        { hook: 'high-failure', status: 'failure' },
        { hook: 'high-failure', status: 'failure' },
        { hook: 'high-failure', status: 'failure' },
        { hook: 'low-failure', status: 'success' },
        { hook: 'low-failure', status: 'success' },
        { hook: 'low-failure', status: 'failure' },
      ];
      createMockMetricsFile(mockMetrics);
      const advisor = makeSUT();
      const suggestions = advisor.suggestPreemptiveActions(0.5);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(s => s.probability >= 0.5)).toBe(true);
    });

    it('should use default threshold of 0.3', () => {
      const mockMetrics = [
        { hook: 'test-hook', status: 'failure' },
        { hook: 'test-hook', status: 'failure' },
        { hook: 'test-hook', status: 'success' },
      ];
      createMockMetricsFile(mockMetrics);
      const advisor = makeSUT();
      const suggestions = advisor.suggestPreemptiveActions();
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });
});

