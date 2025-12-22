const { analyzeOfflineBackend } = require('../offline-backend-analyzer');

function createMockProject(files) {
  return {
    getSourceFiles: () => files.map(f => ({
      getFilePath: () => f.path,
      getFullText: () => f.content
    }))
  };
}

describe('offline-backend-analyzer', () => {
  describe('analyzeOfflineBackend', () => {
    it('should detect mutation without versioning', () => {
      const project = createMockProject([{
        path: '/app/backend/orders.controller.ts',
        content: '@Post() createOrder(@Body() dto) { return this.service.create(dto); }'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings.some(f => f.ruleId === 'backend.offline.missing_optimistic_locking')).toBe(true);
    });

    it('should not flag when version field present', () => {
      const project = createMockProject([{
        path: '/app/backend/orders.controller.ts',
        content: '@Put() update(@Body() dto) { if (dto.version !== current.version) throw 409; }'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings.filter(f => f.ruleId === 'backend.offline.missing_optimistic_locking')).toHaveLength(0);
    });

    it('should detect mutation without idempotency key', () => {
      const project = createMockProject([{
        path: '/app/api/orders.service.ts',
        content: 'async createOrder(data) { await db.insert(data); }'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings.some(f => f.ruleId === 'backend.offline.missing_idempotency_key')).toBe(true);
      expect(findings.find(f => f.ruleId === 'backend.offline.missing_idempotency_key').severity).toBe('CRITICAL');
    });

    it('should not flag when idempotencyKey present', () => {
      const project = createMockProject([{
        path: '/app/api/orders.service.ts',
        content: 'async createOrder(data, idempotencyKey) { if (await exists(idempotencyKey)) return; await db.insert(data); }'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings.filter(f => f.ruleId === 'backend.offline.missing_idempotency_key')).toHaveLength(0);
    });

    it('should detect sync endpoint without delta', () => {
      const project = createMockProject([{
        path: '/app/backend/sync.controller.ts',
        content: '@Get("/sync") getAll() { return this.repo.findAll(); }'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings.some(f => f.ruleId === 'backend.offline.sync_endpoint_optimization')).toBe(true);
    });

    it('should not flag sync with delta optimization', () => {
      const project = createMockProject([{
        path: '/app/backend/sync.controller.ts',
        content: '@Get("/sync") getChanges(@Query() lastSyncedAt) { return this.repo.findSince(lastSyncedAt); }'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings.filter(f => f.ruleId === 'backend.offline.sync_endpoint_optimization')).toHaveLength(0);
    });

    it('should skip non-backend files', () => {
      const project = createMockProject([{
        path: '/app/frontend/orders.component.ts',
        content: '@Post() createOrder() {}'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings).toHaveLength(0);
    });

    it('should accept etag as versioning', () => {
      const project = createMockProject([{
        path: '/app/backend/orders.controller.ts',
        content: '@Patch() update(@Headers("If-Match") etag) { checkEtag(etag); }'
      }]);
      const findings = [];

      analyzeOfflineBackend(project, findings);

      expect(findings.filter(f => f.ruleId === 'backend.offline.missing_optimistic_locking')).toHaveLength(0);
    });
  });
});
