const { execSync, spawnSync } = require('child_process');
const { ConfigurationError } = require('../../domain/errors');

const { recordMetric } = require('../../../infrastructure/telemetry/metrics-logger');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class GitFlowService {
    constructor(repoRoot, options = {}, logger = console, gitQuery = null, gitCommand = null, githubAdapter = null) {
        recordMetric({
            hook: 'git_flow_service',
            operation: 'constructor',
            status: 'started',
            repoRoot: repoRoot.substring(0, 100),
            hasOptions: !!options
        });

        this.repoRoot = repoRoot;
        this.logger = logger;
        this.gitQuery = gitQuery;
        this.gitCommand = gitCommand || (gitQuery && gitQuery.commandAdapter ? gitQuery : null);
        this.github = githubAdapter;

        this.developBranch = options.developBranch || 'develop';
        this.mainBranch = options.mainBranch || 'main';
        this.autoSyncEnabled = options.autoSyncEnabled !== false;
        this.autoCleanEnabled = options.autoCleanEnabled !== false;
        this.requireClean = options.requireClean !== false;

        this._validateDependencies();

        recordMetric({
            hook: 'git_flow_service',
            operation: 'constructor',
            status: 'success',
            developBranch: this.developBranch,
            mainBranch: this.mainBranch,
            autoSyncEnabled: this.autoSyncEnabled,
            autoCleanEnabled: this.autoCleanEnabled
        });
    }

    _validateDependencies() {
        if (!this.gitQuery) this.logger.warn('GitFlowService: gitQuery adapter missing');
        if (!this.gitCommand) this.logger.warn('GitFlowService: gitCommand adapter missing');
        if (!this.github) this.logger.warn('GitFlowService: githubAdapter missing');
    }

    getCurrentBranch() {
        const m_get_current_branch = createMetricScope({
            hook: 'git_flow_service',
            operation: 'get_current_branch'
        });

        m_get_current_branch.started();
        if (this.gitQuery) {
            m_get_current_branch.success();
            return this.gitQuery.getCurrentBranch();
        }
        m_get_current_branch.success();
        return 'unknown';
    }

    isClean() {
        if (this.gitQuery) {
            const changes = this.gitQuery.getUncommittedChanges();
            return !changes || changes.length === 0;
        }
        return false;
    }

    syncBranches() {
        recordMetric({
            hook: 'git_flow_service',
            operation: 'sync_branches',
            status: 'started',
            autoSyncEnabled: this.autoSyncEnabled
        });

        if (!this.autoSyncEnabled) {
            recordMetric({
                hook: 'git_flow_service',
                operation: 'sync_branches',
                status: 'skipped',
                reason: 'auto_sync_disabled'
            });
            return { success: false, message: 'Auto-sync disabled' };
        }

        if (!this.isClean()) {
            this.logger.warn('Skipping sync: working directory not clean');
            recordMetric({
                hook: 'git_flow_service',
                operation: 'sync_branches',
                status: 'skipped',
                reason: 'working_directory_not_clean'
            });
            return { success: false, message: 'Working directory not clean' };
        }

        try {
            const current = this.getCurrentBranch();
            this.logger.info('Starting branch synchronization', { currentBranch: current });

            if (this.gitCommand) {
                this.gitCommand.fetchRemote('origin');

                this.gitCommand.checkout(this.developBranch);
                this.gitCommand.pull('origin', this.developBranch);

                this.gitCommand.checkout(this.mainBranch);
                this.gitCommand.pull('origin', this.mainBranch);

                this.gitCommand.checkout(current);
            } else {
                recordMetric({
                    hook: 'git_flow_service',
                    operation: 'sync_branches',
                    status: 'failed',
                    reason: 'no_git_command_adapter'
                });
                throw new ConfigurationError('GitCommandAdapter is required for branch synchronization', 'gitCommand');
            }

            this.logger.info('Branches synchronized successfully', {
                branches: [this.developBranch, this.mainBranch]
            });
            recordMetric({
                hook: 'git_flow_service',
                operation: 'sync_branches',
                status: 'success',
                branches: [this.developBranch, this.mainBranch].join(',')
            });
            return { success: true, message: 'Branches synchronized' };
        } catch (error) {
            this.logger.error('Branch synchronization failed', { error: error.message });
            recordMetric({
                hook: 'git_flow_service',
                operation: 'sync_branches',
                status: 'failed',
                error: error.message.substring(0, 100)
            });
            return { success: false, message: error.message };
        }
    }

    createPullRequest(sourceBranch, targetBranch, title, body) {
        const m_create_pull_request = createMetricScope({
            hook: 'git_flow_service',
            operation: 'create_pull_request'
        });

        m_create_pull_request.started();
        if (!this.github) {
            this.logger.error('GitHub adapter not available');
            m_create_pull_request.success();
            return null;
        }

        try {
            this.logger.info('Creating Pull Request', { source: sourceBranch, target: targetBranch, title });

            const prUrl = this.github.createPullRequest(targetBranch, sourceBranch, title, body);

            if (prUrl) {
                this.logger.info('Pull Request created successfully', { prUrl });
            } else {
                this.logger.warn('Pull Request creation failed or returned no URL');
            }

            m_create_pull_request.success();

            return prUrl;
        } catch (error) {
            this.logger.error('[GitFlowService] Failed to create PR:', { error: error.message });
            m_create_pull_request.success();
            return null;
        }
        m_create_pull_request.success();
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
            if (this.github) {
                this.logger.info('Merging Pull Request', { prUrl });
                this.github.mergePullRequest(prUrl);
            } else {
                throw new ConfigurationError('GitHub adapter required for merging PR', 'github');
            }

            // Clean up merged branch
            if (this.autoCleanEnabled) {
                this.logger.info('Cleaning up branches', { branch: this.developBranch });
                // Note: Branch deletion should be implemented in GitCommandAdapter if strictly needed.
                // Currently skipped to avoid direct child_process usage.
            }

            this.logger.info('Successfully merged develop to main');
            return { success: true, message: 'Successfully merged develop to main' };
        } catch (error) {
            this.logger.error('Merge process failed', { error: error.message });
            return { success: false, message: error.message };
        }
    }

    isGitHubAvailable() {
        return this.github ? this.github.isAvailable() : false;
    }
}

module.exports = GitFlowService;
