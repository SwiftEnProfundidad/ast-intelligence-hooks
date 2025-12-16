const { analyzeNetworkResilience } = require('../network-resilience-analyzer');

function createMockProject(files) {
  return {
    getSourceFiles: () => files.map(f => ({
      getFilePath: () => f.path,
      getFullText: () => f.content
    }))
  };
}

describe('network-resilience-analyzer', () => {
  describe('retry policy', () => {
    it('should detect network call without retry', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'async getData() { return fetch("/api/data"); }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.some(f => f.ruleId === 'common.network.missing_retry_policy')).toBe(true);
    });

    it('should not flag when retry present', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'async getData() { return fetchWithRetry("/api/data", { retry: 3 }); }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.filter(f => f.ruleId === 'common.network.missing_retry_policy')).toHaveLength(0);
    });

    it('should skip test files', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'test("should work", () => { fetch("/api/data"); })'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.filter(f => f.ruleId === 'common.network.missing_retry_policy')).toHaveLength(0);
    });
  });

  describe('timeout configuration', () => {
    it('should detect network call without timeout', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'axios.get("/api/data")'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.some(f => f.ruleId === 'common.network.missing_timeout')).toBe(true);
    });

    it('should not flag when timeout present', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'axios.get("/api/data", { timeout: 30000 })'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.filter(f => f.ruleId === 'common.network.missing_timeout')).toHaveLength(0);
    });
  });

  describe('circuit breaker', () => {
    it('should detect multiple retries without circuit breaker', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'retry retry retry retry fetch("/api")'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.some(f => f.ruleId === 'common.network.missing_circuit_breaker')).toBe(true);
    });

    it('should not flag when circuit breaker present', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'retry retry retry retry circuitBreaker()'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.filter(f => f.ruleId === 'common.network.missing_circuit_breaker')).toHaveLength(0);
    });
  });

  describe('request queue', () => {
    it('should detect offline context without queue', () => {
      const project = createMockProject([{
        path: '/app/services/offline.service.ts',
        content: 'if (offline) { fetch("/api/data"); }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.some(f => f.ruleId === 'common.network.missing_request_queue')).toBe(true);
    });

    it('should not flag when queue present', () => {
      const project = createMockProject([{
        path: '/app/services/offline.service.ts',
        content: 'if (offline) { OfflineQueue.add(fetch("/api")); }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.filter(f => f.ruleId === 'common.network.missing_request_queue')).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should detect network call without error handling', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'function get() { axios.get("/api"); }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.some(f => f.ruleId === 'common.network.missing_error_handling')).toBe(true);
    });

    it('should not flag when try-catch present', () => {
      const project = createMockProject([{
        path: '/app/services/api.service.ts',
        content: 'try { axios.get("/api"); } catch(e) { handle(e); }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.filter(f => f.ruleId === 'common.network.missing_error_handling')).toHaveLength(0);
    });
  });

  describe('connection pooling', () => {
    it('should detect HTTP client without pooling', () => {
      const project = createMockProject([{
        path: '/app/services/http.client.ts',
        content: 'class ApiClient { }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.some(f => f.ruleId === 'common.network.missing_connection_pooling')).toBe(true);
    });

    it('should not flag when HttpAgent configured', () => {
      const project = createMockProject([{
        path: '/app/services/http.client.ts',
        content: 'class ApiClient { agent = new HttpAgent({ keepAlive: true }); }'
      }]);
      const findings = [];

      analyzeNetworkResilience(project, findings);

      expect(findings.filter(f => f.ruleId === 'common.network.missing_connection_pooling')).toHaveLength(0);
    });
  });
});
