/**
 * IGitCommandPort
 *
 * Port interface for Git write operations (Commands).
 */
const { NotImplementedError } = require('../errors');

class IGitCommandPort {
    /**
     * Create a new branch from current HEAD
     * @param {string} branchName
     * @returns {boolean}
     */
    createBranch(branchName) {
        throw new NotImplementedError('IGitCommandPort.createBranch() must be implemented');
    }

    /**
     * Checkout to a branch
     * @param {string} branchName
     * @returns {boolean}
     */
    checkout(branchName) {
        throw new NotImplementedError('IGitCommandPort.checkout() must be implemented');
    }

    /**
     * Stage files
     * @param {string[]} files
     * @returns {boolean}
     */
    stageFiles(files) {
        throw new NotImplementedError('IGitCommandPort.stageFiles() must be implemented');
    }

    /**
     * Stage all files
     * @returns {boolean}
     */
    stageAll() {
        throw new NotImplementedError('IGitCommandPort.stageAll() must be implemented');
    }

    /**
     * Commit staged changes
     * @param {string} message
     * @returns {boolean}
     */
    commit(message) {
        throw new NotImplementedError('IGitCommandPort.commit() must be implemented');
    }

    /**
     * Push to remote
     * @param {string} remote
     * @param {string} branch
     * @returns {boolean}
     */
    push(remote, branch) {
        throw new NotImplementedError('IGitCommandPort.push() must be implemented');
    }

    /**
     * Push to remote setting upstream
     * @param {string} remote
     * @param {string} branch
     * @returns {boolean}
     */
    pushWithUpstream(remote, branch) {
        throw new NotImplementedError('IGitCommandPort.pushWithUpstream() must be implemented');
    }

    /**
     * Fetch from remote
     * @param {string} remote
     * @returns {boolean}
     */
    fetchRemote(remote) {
        throw new NotImplementedError('IGitCommandPort.fetchRemote() must be implemented');
    }

    /**
     * Pull from remote
     * @param {string} remote
     * @param {string} branch
     * @returns {boolean}
     */
    pull(remote, branch) {
        throw new NotImplementedError('IGitCommandPort.pull() must be implemented');
    }

    /**
     * Stash changes
     * @param {string} message
     * @returns {boolean}
     */
    stash(message) {
        throw new NotImplementedError('IGitCommandPort.stash() must be implemented');
    }

    /**
     * Pop stash
     * @returns {boolean}
     */
    stashPop() {
        throw new NotImplementedError('IGitCommandPort.stashPop() must be implemented');
    }
}

module.exports = IGitCommandPort;
