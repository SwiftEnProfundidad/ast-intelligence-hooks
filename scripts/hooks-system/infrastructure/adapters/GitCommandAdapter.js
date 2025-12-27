const IGitCommandPort = require('../../domain/ports/IGitCommandPort');
const GitCommandRunner = require('./git/GitCommandRunner');
const GitCommandService = require('./git/GitCommandService');

class GitCommandAdapter extends IGitCommandPort {
    constructor(config = {}) {
        super();
        this.repoRoot = config.repoRoot || process.cwd();
        this.logger = config.logger || console;

        this.runner = new GitCommandRunner(this.repoRoot, this.logger);
        this.commandService = new GitCommandService(this.runner);
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
        return this.commandService.push(remote, branch);
    }

    pushWithUpstream(remote = 'origin', branch) {
        return this.commandService.pushWithUpstream(remote, branch);
    }

    fetchRemote(remote = 'origin') {
        return this.commandService.fetchRemote(remote);
    }

    pull(remote = 'origin', branch = null) {
        return this.commandService.pull(remote, branch);
    }

    stash(message = 'WIP') {
        return this.commandService.stash(message);
    }

    stashPop() {
        return this.commandService.stashPop();
    }

    fetchRemote(remote = 'origin') {
        return this.commandService.fetchRemote(remote);
    }

    pull(remote = 'origin', branch = null) {
        return this.commandService.pull(remote, branch);
    }
}

module.exports = GitCommandAdapter;
