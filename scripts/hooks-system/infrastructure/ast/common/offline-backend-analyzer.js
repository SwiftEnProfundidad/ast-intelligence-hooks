function analyzeOfflineBackend(project, findings) {
  project.getSourceFiles().forEach(sf => {
    const content = sf.getFullText();
    const filePath = sf.getFilePath();
    
    if (!filePath.includes('backend') && !filePath.includes('api')) return;
    
    if (content.match(/@Post|@Put|@Patch/gi)) {
      const hasVersioning = /version|etag|lastModified|timestamp/i.test(content);
      if (!hasVersioning) {
        findings.push({
          filePath, line: 1, column: 0, severity: 'HIGH',
          ruleId: 'backend.offline.missing_optimistic_locking',
          message: 'Mutation endpoint without versioning - implement optimistic locking (version/etag) for conflict resolution',
          category: 'Offline', suggestion: 'Add version field to DTOs, check on update, return 409 Conflict if mismatch'
        });
      }
    }
    
    if (content.match(/async\s+\w+\([^)]*\).*{[\s\S]*?insert|update|delete/i)) {
      const hasIdempotency = /idempotencyKey|requestId|deduplication/i.test(content);
      if (!hasIdempotency) {
        findings.push({
          filePath, line: 1, column: 0, severity: 'CRITICAL',
          ruleId: 'backend.offline.missing_idempotency_key',
          message: 'Mutation without idempotency key - retried requests will duplicate data',
          category: 'Offline', suggestion: 'Add idempotencyKey to request headers, check before processing'
        });
      }
    }
    
    if (content.includes('/sync') || content.includes('SyncController')) {
      const hasOptimization = /lastSyncedAt|delta|incremental/i.test(content);
      if (!hasOptimization) {
        findings.push({
          filePath, line: 1, column: 0, severity: 'HIGH',
          ruleId: 'backend.offline.sync_endpoint_optimization',
          message: 'Sync endpoint without delta sync - full sync wastes bandwidth in rural areas',
          category: 'Offline', suggestion: 'Implement delta sync: return only changes since lastSyncedAt timestamp'
        });
      }
    }
  });
}

module.exports = { analyzeOfflineBackend };

