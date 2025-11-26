/**
 * Domain Layer Exports
 * @pumuki/ast-intelligence-hooks
 * 
 * Core business entities and rules
 */

const Finding = require('./entities/Finding');
const AuditResult = require('./entities/AuditResult');
const EvidenceStatus = require('./entities/EvidenceStatus');
const CommitBlockingRules = require('./rules/CommitBlockingRules');
const IFindingsRepository = require('./repositories/IFindingsRepository');
const IEvidenceRepository = require('./repositories/IEvidenceRepository');

module.exports = {
    // Entities
    Finding,
    AuditResult,
    EvidenceStatus,

    // Rules
    CommitBlockingRules,

    // Repository Interfaces
    IFindingsRepository,
    IEvidenceRepository
};
