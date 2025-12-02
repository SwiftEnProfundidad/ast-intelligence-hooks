/**
 * IEvidencePort
 *
 * Port interface for Evidence operations.
 * Infrastructure adapters must implement this interface.
 */
class IEvidencePort {
    /**
     * Read the current evidence state
     * @returns {Object|null} Evidence object or null if not found
     */
    read() {
        throw new Error('IEvidencePort.read() must be implemented');
    }

    /**
     * Write evidence to storage
     * @param {Object} evidence - Evidence object to write
     * @returns {boolean} Success status
     */
    write(evidence) {
        throw new Error('IEvidencePort.write() must be implemented');
    }

    /**
     * Check if evidence exists
     * @returns {boolean}
     */
    exists() {
        throw new Error('IEvidencePort.exists() must be implemented');
    }

    /**
     * Get evidence age in seconds
     * @returns {number} Age in seconds, or Infinity if not found
     */
    getAgeSeconds() {
        throw new Error('IEvidencePort.getAgeSeconds() must be implemented');
    }

    /**
     * Check if evidence is stale (older than threshold)
     * @param {number} thresholdSeconds - Max age in seconds (default: 180)
     * @returns {boolean}
     */
    isStale(thresholdSeconds = 180) {
        throw new Error('IEvidencePort.isStale() must be implemented');
    }

    /**
     * Refresh evidence by running update script
     * @param {Object} options - Options for refresh
     * @returns {boolean} Success status
     */
    refresh(options = {}) {
        throw new Error('IEvidencePort.refresh() must be implemented');
    }

    /**
     * Get the current session name from evidence
     * @returns {string|null}
     */
    getSession() {
        throw new Error('IEvidencePort.getSession() must be implemented');
    }

    /**
     * Get platforms from evidence
     * @returns {string[]}
     */
    getPlatforms() {
        throw new Error('IEvidencePort.getPlatforms() must be implemented');
    }

    /**
     * Get modified files from evidence
     * @returns {string[]}
     */
    getModifiedFiles() {
        throw new Error('IEvidencePort.getModifiedFiles() must be implemented');
    }
}

module.exports = IEvidencePort;
