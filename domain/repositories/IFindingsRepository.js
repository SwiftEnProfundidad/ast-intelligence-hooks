const { NotImplementedError } = require('../errors');

class IFindingsRepository {
  async save(findings) {
    throw new NotImplementedError('IFindingsRepository.save() must be implemented');
  }

  async load() {
    throw new NotImplementedError('IFindingsRepository.load() must be implemented');
  }

  async clear() {
    throw new NotImplementedError('IFindingsRepository.clear() must be implemented');
  }

  async exists() {
    throw new NotImplementedError('IFindingsRepository.exists() must be implemented');
  }

  async saveAuditResult(auditResult) {
    throw new NotImplementedError('IFindingsRepository.saveAuditResult() must be implemented');
  }

  async loadAuditResult() {
    throw new NotImplementedError('IFindingsRepository.loadAuditResult() must be implemented');
  }
}

module.exports = IFindingsRepository;
