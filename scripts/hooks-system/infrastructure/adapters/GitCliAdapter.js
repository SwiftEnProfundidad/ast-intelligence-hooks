/**
 * GitCliAdapter
 *
 * Infrastructure adapter implementing IGitPort using git CLI.
 */
const GitCommandRunner = require('./git/GitCommandRunner');

class GitCliAdapter {
    constructor(config = {}) {
        this.repoRoot = config.repoRoot || process.cwd();
        this.logger = config.logger || console;
        this.protectedBranches = config.protectedBranches || ['main', 'master', 'develop'];
        this.runner = new GitCommandRunner(this.repoRoot, this.logger);
    }

    exec(command) {
        return this.runner.exec(command);
    }

    getCurrentBranch() {
        return this.runner.exec('git branch --show-current') || 'unknown';
    }

    isProtectedBranch() {
        const current = this.getCurrentBranch();
        return this.protectedBranches.includes(current);
    }

    getUncommittedChanges() {
        return this.runner.exec('git status --porcelain') || '';
    }

    getStagedFiles() {
        const output = this.runner.exec('git diff --cached --name-only');
        if (!output) return [];
        return output.split('\n').filter(f => f.trim().length > 0);
    }

    createBranch(branchName) {
        const result = this.runner.exec(`git checkout -b ${branchName}`);
        return result !== null;
    }

    checkout(branchName) {
        const result = this.runner.exec(`git checkout ${branchName}`);
        return result !== null;
    }

    stageFiles(files) {
        if (!files || files.length === 0) return false;
        const fileList = files.join(' ');
        const result = this.runner.exec(`git add ${fileList}`);
        return result !== null;
    }

    stageAll() {
        const result = this.runner.exec('git add -A');
        return result !== null;
    }

    commit(message) {
        const safeMessage = message.replace(/"/g, '\\"');
        const result = this.runner.exec(`git commit -m "${safeMessage}"`);
        return result !== null;
    }

    push(remote = 'origin', branch = null) {
        const targetBranch = branch || this.getCurrentBranch();
        const result = this.runner.exec(`git push ${remote} ${targetBranch}`);
        return result !== null;
    }

    pushWithUpstream(remote = 'origin') {
        const branch = this.getCurrentBranch();
        const result = this.runner.exec(`git push -u ${remote} ${branch}`);
        return result !== null;
    }

    hasUncommittedChanges() {
        const changes = this.getUncommittedChanges();
        return changes.length > 0;
    }

    hasStagedChanges() {
        const staged = this.getStagedFiles();
        return staged.length > 0;
    }

    getRecentCommits(count = 5) {
        const output = this.runner.exec(`git log -${count} --oneline`);
        if (!output) return [];
        return output.split('\n').filter(l => l.trim().length > 0);
    }

    stash(message = 'WIP') {
        const result = this.runner.exec(`git stash -u -m "${message}"`);
        return result !== null;
    }

    stashPop() {
        const result = this.runner.exec('git stash pop');
        return result !== null;
    }
}

module.exports = GitCliAdapter;
