/**
 * IGitQueryPort
 *
 * Port interface for Git read-only operations (Queries).
 */
const { NotImplementedError } = require('../errors');

class IGitQueryPort {
    /**
     * Get current branch name
     * @returns {string}
     */
    getCurrentBranch() {
        throw new NotImplementedError('IGitQueryPort.getCurrentBranch() must be implemented');
    }

    /**
     * Check if current branch is protected
     * @returns {boolean}
     */
    isProtectedBranch() {
        throw new NotImplementedError('IGitQueryPort.isProtectedBranch() must be implemented');
    }

    /**
     * Get uncommitted changes (git status --porcelain)
     * @returns {string}
     */
    getUncommittedChanges() {
        throw new NotImplementedError('IGitQueryPort.getUncommittedChanges() must be implemented');
    }

    /**
     * Get staged files
     * @returns {string[]}
     */
    getStagedFiles() {
        throw new NotImplementedError('IGitQueryPort.getStagedFiles() must be implemented');
    }

    /**
     * has uncommitted changes boolean
     * @returns {boolean}
     */
    hasUncommittedChanges() {
        throw new NotImplementedError('IGitQueryPort.hasUncommittedChanges() must be implemented');
    }

    /**
     * has staged changes boolean
     * @returns {boolean}
     */
    hasStagedChanges() {
        throw new NotImplementedError('IGitQueryPort.hasStagedChanges() must be implemented');
    }

    /**
     * Get recent commits log
     * @param {number} count
     * @returns {string[]}
     */
    getRecentCommits(count) {
        throw new NotImplementedError('IGitQueryPort.getRecentCommits() must be implemented');
    }

    /**
     * Get git diff output
     * @param {boolean} cached - Whether to diff cached (staged) files
     * @returns {string}
     */
    getDiff(cached) {
        throw new NotImplementedError('IGitQueryPort.getDiff() must be implemented');
    }

    /**
     * Get status output (short format)
     * @returns {string}
     */
    getStatusShort() {
        throw new NotImplementedError('IGitQueryPort.getStatusShort() must be implemented');
    }

    /**
     * Get detailed log with stats
     * @param {number} count
     * @returns {string}
     */
    getLog(count) {
        throw new NotImplementedError('IGitQueryPort.getLog() must be implemented');
    }
}

module.exports = IGitQueryPort;
