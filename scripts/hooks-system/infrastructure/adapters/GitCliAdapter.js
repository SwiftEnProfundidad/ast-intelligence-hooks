/**
 * GitCliAdapter
 *
 * Infrastructure adapter implementing IGitPort using git CLI.
 */
const GitCommandRunner = require('./git/GitCommandRunner');
const GitQueryService = require('./git/GitQueryService');
const GitCommandService = require('./git/GitCommandService');

class GitCliAdapter {
    constructor(config = {}) {
        this.repoRoot = config.repoRoot || process.cwd();
        this.logger = config.logger || console;
        this.protectedBranches = config.protectedBranches || ['main', 'master', 'develop'];

        this.runner = new GitCommandRunner(this.repoRoot, this.logger);
        this.queryService = new GitQueryService(this.runner);
        this.commandService = new GitCommandService(this.runner);
    }

    exec(command) {
        return this.runner.exec(command);
    }

    getCurrentBranch() {
        return this.queryService.getCurrentBranch();
    }

    isProtectedBranch() {
        const current = this.getCurrentBranch();
        return this.protectedBranches.includes(current);
    }

    getUncommittedChanges() {
        return this.queryService.getUncommittedChanges();
    }

    getStagedFiles() {
        return this.queryService.getStagedFiles();
    }

    createBranch(branchName) {
        return this.commandService.createBranch(branchName);
    }

    checkout(branchName) {
        return this.commandService.checkout(branchName);
    }

    stageFiles(files) {
        return this.commandService.stageFiles(files);
    }

    stageAll() {
        return this.commandService.stageAll();
    }

    commit(message) {
        return this.commandService.commit(message);
    }

    push(remote = 'origin', branch = null) {
        const targetBranch = branch || this.getCurrentBranch();
        return this.commandService.push(remote, targetBranch);
    }

    pushWithUpstream(remote = 'origin') {
        const branch = this.getCurrentBranch();
        return this.commandService.pushWithUpstream(remote, branch);
    }

    hasUncommittedChanges() {
        return this.queryService.hasUncommittedChanges();
    }

    hasStagedChanges() {
        return this.queryService.hasStagedChanges();
    }

    getRecentCommits(count = 5) {
        return this.queryService.getRecentCommits(count);
    }

    stash(message = 'WIP') {
        return this.commandService.stash(message);
    }

    stashPop() {
        return this.commandService.stashPop();
    }
}

module.exports = GitCliAdapter;
