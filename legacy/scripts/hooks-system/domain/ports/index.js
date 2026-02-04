/**
 * Domain Ports - Interfaces for infrastructure adapters
 */
const INotificationPort = require('./INotificationPort');
const IGitPort = require('./IGitPort');
const IAstPort = require('./IAstPort');
const IEvidencePort = require('./IEvidencePort');

module.exports = {
    INotificationPort,
    IGitPort,
    IAstPort,
    IEvidencePort
};
