const { execSync } = require('child_process');

class GitFlowService {
    constructor(repoRoot, options = {}, logger = console) {
        this.repoRoot = repoRoot;
        this.logger = logger;
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
            this.logger.warn('Failed to get current branch', { error: error.message });
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
            this.logger.error('Failed to check git status', { error: error.message });
            return false;
        }
    }

    syncBranches() {
        if (!this.autoSyncEnabled) {
            return { success: false, message: 'Auto-sync disabled' };
        }

        if (!this.isClean()) {
            this.logger.warn('Skipping sync: working directory not clean');
            return { success: false, message: 'Working directory not clean' };
        }

        try {
            const current = this.getCurrentBranch();
            this.logger.info('Starting branch synchronization', { currentBranch: current });

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

            this.logger.info('Branches synchronized successfully', {
                branches: [this.developBranch, this.mainBranch]
            });
            return { success: true, message: 'Branches synchronized' };
        } catch (error) {
            this.logger.error('Branch synchronization failed', { error: error.message });
            return { success: false, message: error.message };
        }
    }

    createPullRequest(sourceBranch, targetBranch, title, body) {
        try {
            this.logger.info('Creating Pull Request', { source: sourceBranch, target: targetBranch, title });
            const result = execSync(
                `gh pr create --base ${targetBranch} --head ${sourceBranch} --title "${title}" --body "${body}"`,
                { cwd: this.repoRoot, encoding: 'utf8' }
            );

            const urlMatch = result.match(/https:\/\/github\.com\/.*\/pull\/\d+/);
            const prUrl = urlMatch ? urlMatch[0] : null;

            if (prUrl) {
                this.logger.info('Pull Request created successfully', { prUrl });
            } else {
                this.logger.warn('Pull Request creation output did not contain URL', { output: result });
            }

            return prUrl;
        } catch (error) {
            this.logger.error('[GitFlowService] Failed to create PR:', { error: error.message });
            return null;
        }
    }

    mergeDevelopToMain() {
        if (!this.isClean()) {
            this.logger.warn('Skipping merge: working directory not clean');
            return { success: false, message: 'Working directory not clean' };
        }

        try {
            this.logger.info('Starting merge process: develop -> main');

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
            this.logger.info('Merging Pull Request', { prUrl });
            execSync(`gh pr merge ${prUrl.split('/').pop()} --merge`, {
                cwd: this.repoRoot,
                encoding: 'utf8'
            });

            // Clean up merged branch
            if (this.autoCleanEnabled) {
                this.logger.info('Cleaning up branches', { branch: this.developBranch });
                execSync(`git branch -d ${this.developBranch}`, { cwd: this.repoRoot });
                execSync(`git push origin --delete ${this.developBranch}`, { cwd: this.repoRoot });
            }

            this.logger.info('Successfully merged develop to main');
            return { success: true, message: 'Successfully merged develop to main' };
        } catch (error) {
            this.logger.error('Merge process failed', { error: error.message });
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
