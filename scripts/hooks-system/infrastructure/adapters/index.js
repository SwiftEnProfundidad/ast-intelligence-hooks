/**
 * Infrastructure Adapters - Implementations of domain ports
 */
const MacOSNotificationAdapter = require('./MacOSNotificationAdapter');
const GitCliAdapter = require('./GitCliAdapter');
const AstAnalyzerAdapter = require('./AstAnalyzerAdapter');
const FileEvidenceAdapter = require('./FileEvidenceAdapter');

module.exports = {
    MacOSNotificationAdapter,
    GitCliAdapter,
    AstAnalyzerAdapter,
    FileEvidenceAdapter
};
