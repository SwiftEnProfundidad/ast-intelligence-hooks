const AuditLogger = require('../../../application/services/logging/AuditLogger');

class GitCommandService {
    constructor(commandRunner) {
        this.runner = commandRunner;
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
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
        const targetBranch = branch || 'HEAD'; // Default to HEAD if no branch, handled by caller mostly
        const result = this.runner.exec(`git push ${remote} ${targetBranch}`);
        return result !== null;
    }

    pushWithUpstream(remote = 'origin', branch) {
        const result = this.runner.exec(`git push -u ${remote} ${branch}`);
        return result !== null;
    }

    fetchRemote(remote = 'origin') {
        const result = this.runner.exec(`git fetch ${remote}`);
        return result !== null;
    }

    pull(remote = 'origin', branch = null) {
        const target = branch ? `${remote} ${branch}` : '';
        const result = this.runner.exec(`git pull ${target}`.trim());
        return result !== null;
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

module.exports = GitCommandService;
