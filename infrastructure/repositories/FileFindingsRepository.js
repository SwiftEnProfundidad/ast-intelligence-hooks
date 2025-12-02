// ===== FILE FINDINGS REPOSITORY =====
// Infrastructure Layer - Repository Implementation
// Persists findings to JSON files

const fs = require('fs').promises;
const path = require('path');
const IFindingsRepository = require('../../domain/repositories/IFindingsRepository');
const Finding = require('../../domain/entities/Finding');
const AuditResult = require('../../domain/entities/AuditResult');

class FileFindingsRepository extends IFindingsRepository {
  constructor(basePath = '.audit_tmp') {
    super();
    this.basePath = basePath;
    this.findingsFile = path.join(basePath, 'findings.json');
    this.auditResultFile = path.join(basePath, 'audit-result.json');
  }

  async ensureDirectory() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async save(findings) {
    await this.ensureDirectory();

    const data = findings.map(f => f.toJSON());
    const json = JSON.stringify(data, null, 2);

    await fs.writeFile(this.findingsFile, json, 'utf-8');
  }

  async load() {
    try {
      const json = await fs.readFile(this.findingsFile, 'utf-8');
      const data = JSON.parse(json);
      return data.map(f => Finding.fromJSON(f));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async clear() {
    try {
      await fs.unlink(this.findingsFile);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists() {
    try {
      await fs.access(this.findingsFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  async saveAuditResult(auditResult) {
    await this.ensureDirectory();

    const json = JSON.stringify(auditResult.toJSON(), null, 2);
    await fs.writeFile(this.auditResultFile, json, 'utf-8');
  }

  async loadAuditResult() {
    try {
      const json = await fs.readFile(this.auditResultFile, 'utf-8');
      const data = JSON.parse(json);
      return AuditResult.fromJSON(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return new AuditResult([]);
      }
      throw error;
    }
  }
}

module.exports = FileFindingsRepository;
