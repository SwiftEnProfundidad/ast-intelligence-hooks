// ===== FINDINGS REPOSITORY INTERFACE =====
// Domain Layer - Repository Interface
// Defines contract for persisting and retrieving audit findings

class IFindingsRepository {
  async save(findings) {
    throw new Error('IFindingsRepository.save() must be implemented');
  }

  async load() {
    throw new Error('IFindingsRepository.load() must be implemented');
  }

  async clear() {
    throw new Error('IFindingsRepository.clear() must be implemented');
  }

  async exists() {
    throw new Error('IFindingsRepository.exists() must be implemented');
  }

  async saveAuditResult(auditResult) {
    throw new Error('IFindingsRepository.saveAuditResult() must be implemented');
  }

  async loadAuditResult() {
    throw new Error('IFindingsRepository.loadAuditResult() must be implemented');
  }
}

module.exports = IFindingsRepository;

