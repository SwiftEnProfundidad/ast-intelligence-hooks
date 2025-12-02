/**
 * IGitPort
 *
 * Port interface for Git operations.
 * Infrastructure adapters must implement this interface.
 */
class IGitPort {
    /**
     * Get current branch name
     * @returns {string}
     */
    getCurrentBranch() {
        throw new Error('IGitPort.getCurrentBranch() must be implemented');
    }

    /**
     * Check if current branch is protected
     * @returns {boolean}
     */
    isProtectedBranch() {
        throw new Error('IGitPort.isProtectedBranch() must be implemented');
    }

    /**
     * Get uncommitted changes (git status --porcelain)
     * @returns {string}
     */
    getUncommittedChanges() {
        throw new Error('IGitPort.getUncommittedChanges() must be implemented');
    }

    /**
     * Get staged files
     * @returns {string[]}
     */
    getStagedFiles() {
        throw new Error('IGitPort.getStagedFiles() must be implemented');
    }

    /**
     * Create a new branch from current HEAD
     * @param {string} branchName
     * @returns {boolean}
     */
    createBranch(branchName) {
        throw new Error('IGitPort.createBranch() must be implemented');
    }

    /**
     * Checkout to a branch
     * @param {string} branchName
     * @returns {boolean}
     */
    checkout(branchName) {
        throw new Error('IGitPort.checkout() must be implemented');
    }

    /**
     * Stage files
     * @param {string[]} files
     * @returns {boolean}
     */
    stageFiles(files) {
        throw new Error('IGitPort.stageFiles() must be implemented');
    }

    /**
     * Commit staged changes
     * @param {string} message
     * @returns {boolean}
     */
    commit(message) {
        throw new Error('IGitPort.commit() must be implemented');
    }

    /**
     * Push to remote
     * @param {string} remote
     * @param {string} branch
     * @returns {boolean}
     */
    push(remote, branch) {
        throw new Error('IGitPort.push() must be implemented');
    }
}

module.exports = IGitPort;
