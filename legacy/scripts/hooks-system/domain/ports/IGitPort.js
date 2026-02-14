/**
 * IGitPort
 *
 * Port interface for Git operations.
 * Infrastructure adapters must implement this interface.
 */
const { NotImplementedError } = require('../errors');

class IGitPort {
    /**
     * Get current branch name
     * @returns {string}
     */
    getCurrentBranch() {
        throw new NotImplementedError('IGitPort.getCurrentBranch() must be implemented');
    }

    /**
     * Check if current branch is protected
     * @returns {boolean}
     */
    isProtectedBranch() {
        throw new NotImplementedError('IGitPort.isProtectedBranch() must be implemented');
    }

    /**
     * Get uncommitted changes (git status --porcelain)
     * @returns {string}
     */
    getUncommittedChanges() {
        throw new NotImplementedError('IGitPort.getUncommittedChanges() must be implemented');
    }

    /**
     * Get staged files
     * @returns {string[]}
     */
    getStagedFiles() {
        throw new NotImplementedError('IGitPort.getStagedFiles() must be implemented');
    }

    /**
     * Create a new branch from current HEAD
     * @param {string} branchName
     * @returns {boolean}
     */
    createBranch(branchName) {
        throw new NotImplementedError('IGitPort.createBranch() must be implemented');
    }

    /**
     * Checkout to a branch
     * @param {string} branchName
     * @returns {boolean}
     */
    checkout(branchName) {
        throw new NotImplementedError('IGitPort.checkout() must be implemented');
    }

    /**
     * Stage files
     * @param {string[]} files
     * @returns {boolean}
     */
    stageFiles(files) {
        throw new NotImplementedError('IGitPort.stageFiles() must be implemented');
    }

    /**
     * Commit staged changes
     * @param {string} message
     * @returns {boolean}
     */
    commit(message) {
        throw new NotImplementedError('IGitPort.commit() must be implemented');
    }

    /**
     * Get recent commits log
     * @param {number} count
     * @returns {string[]}
     */
    getRecentCommits(count) {
        throw new NotImplementedError('IGitPort.getRecentCommits() must be implemented');
    }

    /**
     * Get git diff output
     * @param {boolean} cached - Whether to diff cached (staged) files
     * @returns {string}
     */
    getDiff(cached = false) {
        throw new NotImplementedError('IGitPort.getDiff() must be implemented');
    }

    /**
     * Get status output (short format)
     * @returns {string}
     */
    getStatusShort() {
        throw new NotImplementedError('IGitPort.getStatusShort() must be implemented');
    }

    /**
     * Get detailed log with stats
     * @param {number} count
     * @returns {string}
     */
    getLog(count) {
        throw new NotImplementedError('IGitPort.getLog() must be implemented');
    }
}

module.exports = IGitPort;
