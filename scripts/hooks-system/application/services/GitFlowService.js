const { execSync } = require('child_process');

class GitFlowService {
    constructor(repoRoot, options = {}) {
        this.repoRoot = repoRoot;
        this.developBranch = options.developBranch || 'develop';
        this.mainBranch = options.mainBranch || 'main';
        this.autoSyncEnabled = options.autoSyncEnabled !== false;
        this.autoCleanEnabled = options.autoCleanEnabled !== false;
        this.requireClean = options.requireClean !== false;
    }

    getCurrentBranch() {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', {
                cwd: this.repoRoot,
                encoding: 'utf8'
            }).trim();
        } catch (error) {
            return 'unknown';
        }
    }

    isClean() {
        try {
            const status = execSync('git status --porcelain', {
                cwd: this.repoRoot,
                encoding: 'utf8'
            }).trim();
            return !status;
        } catch (error) {
            return false;
        }
    }

    syncBranches() {
        if (!this.autoSyncEnabled) {
            return { success: false, message: 'Auto-sync disabled' };
        }

        if (!this.isClean()) {
            return { success: false, message: 'Working directory not clean' };
        }

        try {
            const current = this.getCurrentBranch();

            // Fetch latest
            execSync('git fetch origin', { cwd: this.repoRoot });

            // Sync develop
            execSync(`git checkout ${this.developBranch}`, { cwd: this.repoRoot });
            execSync(`git pull origin ${this.developBranch}`, { cwd: this.repoRoot });

            // Sync main
            execSync(`git checkout ${this.mainBranch}`, { cwd: this.repoRoot });
            execSync(`git pull origin ${this.mainBranch}`, { cwd: this.repoRoot });

            // Return to original branch
            execSync(`git checkout ${current}`, { cwd: this.repoRoot });

            return { success: true, message: 'Branches synchronized' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    createPullRequest(sourceBranch, targetBranch, title, body) {
        try {
            const result = execSync(
                `gh pr create --base ${targetBranch} --head ${sourceBranch} --title "${title}" --body "${body}"`,
                { cwd: this.repoRoot, encoding: 'utf8' }
            );

            const urlMatch = result.match(/https:\/\/github\.com\/.*\/pull\/\d+/);
            return urlMatch ? urlMatch[0] : null;
        } catch (error) {
            console.error('[GitFlowService] Failed to create PR:', error.message);
            return null;
        }
    }

    mergeDevelopToMain() {
        if (!this.isClean()) {
            return { success: false, message: 'Working directory not clean' };
        }

        try {
            // Ensure branches are up to date
            this.syncBranches();

            // Create PR from develop to main
            const prUrl = this.createPullRequest(
                this.developBranch,
                this.mainBranch,
                `Merge ${this.developBranch} into ${this.mainBranch}`,
                'Automated merge from develop to main'
            );

            if (!prUrl) {
                return { success: false, message: 'Failed to create PR' };
            }

            // Merge the PR
            execSync(`gh pr merge ${prUrl.split('/').pop()} --merge`, {
                cwd: this.repoRoot,
                encoding: 'utf8'
            });

            // Clean up merged branch
            if (this.autoCleanEnabled) {
                execSync(`git branch -d ${this.developBranch}`, { cwd: this.repoRoot });
                execSync(`git push origin --delete ${this.developBranch}`, { cwd: this.repoRoot });
            }

            return { success: true, message: 'Successfully merged develop to main' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    isGitHubAvailable() {
        try {
            execSync('gh auth status', { cwd: this.repoRoot, stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = GitFlowService;
