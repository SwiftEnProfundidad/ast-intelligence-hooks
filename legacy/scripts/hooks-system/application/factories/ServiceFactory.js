const ContextDetectionEngine = require('../services/ContextDetectionEngine');
const PlatformDetectionService = require('../services/PlatformDetectionService');
const AutonomousOrchestrator = require('../services/AutonomousOrchestrator');
const AutoExecuteAIStartUseCase = require('../use-cases/AutoExecuteAIStartUseCase');
const UnifiedLogger = require('../services/logging/UnifiedLogger');
const NotificationCenterService = require('../services/notification/NotificationCenterService');
const GitFlowService = require('../services/GitFlowService');
const AuditLogger = require('../services/logging/AuditLogger');
const RealtimeGuardService = require('../services/RealtimeGuardService');
const path = require('path');
const env = require('../../config/env');

class ServiceFactory {
    constructor(repoRoot, instances, adapterFactory) {
        this.repoRoot = repoRoot;
        this.instances = instances;
        this.adapterFactory = adapterFactory;
        this.auditDir = path.join(repoRoot, '.audit-reports');
    }

    getLogger() {
        if (!this.instances.has('logger')) {
            this.instances.set('logger', new UnifiedLogger({
                component: 'HookSystem',
                file: {
                    enabled: true,
                    path: path.join(this.auditDir, 'guard-audit.jsonl'),
                    level: env.get('HOOK_LOG_LEVEL', env.isProd ? 'warn' : 'info')
                },
                console: {
                    enabled: false,
                    level: 'info'
                }
            }));
        }
        return this.instances.get('logger');
    }

    getNotificationService() {
        if (!this.instances.has('notificationService')) {
            const logger = this.getLogger();
            this.instances.set('notificationService', new NotificationCenterService({
                repoRoot: this.repoRoot,
                logger
            }));
        }
        return this.instances.get('notificationService');
    }

    getAuditLogger() {
        if (!this.instances.has('auditLogger')) {
            const logger = this.getLogger();
            this.instances.set('auditLogger', new AuditLogger({
                repoRoot: this.repoRoot,
                filename: path.join('.audit_tmp', 'audit.log'),
                logger
            }));
        }
        return this.instances.get('auditLogger');
    }

    getContextDetectionEngine() {
        if (!this.instances.has('contextEngine')) {
            const gitQuery = this.adapterFactory.getGitQueryAdapter();
            const logger = this.getLogger();
            this.instances.set('contextEngine', new ContextDetectionEngine(gitQuery, logger));
        }
        return this.instances.get('contextEngine');
    }

    getPlatformDetectionService() {
        if (!this.instances.has('platformDetector')) {
            this.instances.set('platformDetector', new PlatformDetectionService());
        }
        return this.instances.get('platformDetector');
    }

    getOrchestrator() {
        if (!this.instances.has('orchestrator')) {
            const contextEngine = this.getContextDetectionEngine();
            const platformDetector = this.getPlatformDetectionService();
            const logger = this.getLogger();

            this.instances.set('orchestrator', new AutonomousOrchestrator(
                contextEngine,
                platformDetector,
                null,
                logger
            ));
        }
        return this.instances.get('orchestrator');
    }

    getAutoExecuteAIStartUseCase() {
        if (!this.instances.has('autoExecuteAIStart')) {
            const orchestrator = this.getOrchestrator();
            const logger = this.getLogger();
            this.instances.set('autoExecuteAIStart', new AutoExecuteAIStartUseCase(orchestrator, this.repoRoot, logger));
        }
        return this.instances.get('autoExecuteAIStart');
    }

    getBlockCommitUseCase() {
        if (!this.instances.has('blockCommit')) {
            const BlockCommitUseCase = require('../use-cases/BlockCommitUseCase');
            this.instances.set('blockCommit', new BlockCommitUseCase());
        }
        return this.instances.get('blockCommit');
    }

    getGitFlowService() {
        if (!this.instances.has('gitFlowService')) {
            const logger = this.getLogger();
            const gitQuery = this.adapterFactory.getGitQueryAdapter();
            const gitCommand = this.adapterFactory.getGitCommandAdapter();
            const github = this.adapterFactory.getGitHubAdapter();

            this.instances.set('gitFlowService', new GitFlowService(this.repoRoot, {
                developBranch: env.get('HOOK_GUARD_GITFLOW_DEVELOP_BRANCH', 'develop'),
                mainBranch: env.get('HOOK_GUARD_GITFLOW_MAIN_BRANCH', 'main'),
                autoSyncEnabled: env.getBool('HOOK_GUARD_GITFLOW_AUTOSYNC', true),
                autoCleanEnabled: env.getBool('HOOK_GUARD_GITFLOW_AUTOCLEAN', true),
                requireClean: env.getBool('HOOK_GUARD_GITFLOW_REQUIRE_CLEAN', true)
            }, logger, gitQuery, gitCommand, github));
        }
        return this.instances.get('gitFlowService');
    }

    getRealtimeGuardService(monitors) {
        if (!this.instances.has('guardService')) {
            const logger = this.getLogger();
            const notificationService = this.getNotificationService();
            const orchestrator = this.getOrchestrator();
            const auditLogger = this.getAuditLogger();
            const config = {
                debugLogPath: path.join(this.auditDir, 'guard-debug.log'),
                repoRoot: this.repoRoot
            };

            this.instances.set('guardService', new RealtimeGuardService({
                logger,
                notificationService,
                monitors,
                orchestration: orchestrator,
                config,
                auditLogger
            }));
        }
        return this.instances.get('guardService');
    }
}

module.exports = ServiceFactory;
